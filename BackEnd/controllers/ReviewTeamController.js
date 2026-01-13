import ReviewTeam from "../models/ReviewTeam.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Feedback from "../models/Feedback.js"
import Intern from "../models/InternDatabase.js";
import axios from "axios";
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as fontkit from "fontkit";
import path from "path";
import fs from "fs";
import ExcelJS from 'exceljs';

export const registerReviewTeam = async (req, res) => {
  try {
    const { fullName, email, password, confirmPassword, mobile, gender, address, city, state, pinCode, Secret_Key } = req.body;

    if (!fullName || !email || !password || !confirmPassword || !mobile || !gender || !Secret_Key) {
      return res.status(400).json({ message: "All required fields must be filled" });
    }

    if (password !== confirmPassword) return res.status(400).json({ message: "Passwords do not match" });
    if (password.length < 6) return res.status(400).json({ message: "Password must be at least 6 characters" });
    if (!mobile.match(/^[0-9]{10}$/)) return res.status(400).json({ message: "Invalid mobile number" });

    // Secret key check against .env
    if (Secret_Key !== process.env.REVIEW_TEAM_SECRET) return res.status(401).json({ message: "Invalid Secret Key" });

    // Check if email exists
    const existingUser = await ReviewTeam.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "Email already registered" });

    // Hash password using bcrypt
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Save user
    const newMember = new ReviewTeam({
      fullName,
      email,
      password: hashedPassword,
      mobile,
      gender,
      address: address || "",
      city: city || "",
      state: state || "",
      pinCode: pinCode || "",
      role: "ReviewTeam"
    });

    await newMember.save();
    res.status(201).json({ message: "Review Team member registered successfully" });

  } catch (error) {
    console.error("Review Team registration error:", error);
    res.status(500).json({ message: "Server error. Please try again." });
  }
};


export const loginReviewTeam = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const member = await ReviewTeam.findOne({ email });
    if (!member) return res.status(401).json({ message: "Invalid email or password" });

    // Check if hashed password exists in DB
    if (!member.password) return res.status(500).json({ message: "User password missing in database" });

    // Compare password using bcrypt
    const isMatch = await bcrypt.compare(password, member.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid email or password" });

    // Generate JWT
    const token = jwt.sign({ id: member._id, role: member.role }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.status(200).json({
      message: "Login successful",
      token,
      member: {
        id: member._id,
        fullName: member.fullName,
        email: member.email,
        role: member.role
      }
    });

  } catch (error) {
    console.error("Review Team login error:", error);
    res.status(500).json({ message: "Server error. Please try again." });
  }
};


export const getFeedbacks = async (req, res) => {
  try {
    const memberId = req.user.id; // from auth middleware
    const feedbacks = await Feedback.find()
      .populate("intern", "fullName email mobile dob")
      .sort({ submittedAt: -1 });

    const formatted = feedbacks.map(f => {
      // Safe data extraction with fallbacks
      const intern = f.intern || {};
      const internshipInfo = f.internshipInfo || {};
      const media = f.media || {};

      return {
        _id: f._id || '',
        uniqueId: f.uniqueId || '',
        internDetails: {
          fullName: intern.fullName || 'N/A',
          email: intern.email || 'N/A',
          mobile: intern.mobile || 'N/A',
          dob: intern.dob
        },
        internshipInfo: {
          domain: internshipInfo.domain || 'N/A',
          duration: internshipInfo.duration || 'N/A',
          startMonth: internshipInfo.startMonth || 'N/A',
          endMonth: internshipInfo.endMonth || 'N/A',
          certificateNumber: internshipInfo.certificateNumber
        },
        feedbackText: f.feedbackText || 'No feedback provided',
        certificateStatus: f.certificateStatus || 'Not Issued',
        media: {
          // Use nested media object first, fallback to direct properties
          photoUrl: media.photoUrl || f.photoUrl || '',
          videoUrl: media.videoUrl || f.videoUrl || ''
        },
        submittedAt: f.submittedAt || new Date()
      };
    });

    res.status(200).json(formatted);
  } catch (error) {
    console.error("Fetch feedbacks error:", error);
    res.status(500).json({ message: "Server error fetching feedbacks" });
  }
};




export const exportFeedbacks = async (req, res) => {
  try {
    const { feedbackIds, options } = req.body;

    // Validate input
    if (!feedbackIds || !Array.isArray(feedbackIds) || feedbackIds.length === 0) {
      return res.status(400).json({ message: "No feedbacks selected for export" });
    }

    if (!options || typeof options !== 'object') {
      return res.status(400).json({ message: "Export options are required" });
    }

    // Validate feedback IDs are valid MongoDB ObjectIds
    const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);
    const validFeedbackIds = feedbackIds.filter(id => isValidObjectId(id));

    if (validFeedbackIds.length === 0) {
      return res.status(400).json({ message: "Invalid feedback IDs provided" });
    }

    // Fetch feedback data with proper error handling
    const feedbacks = await Feedback.find({ _id: { $in: validFeedbackIds } })
      .populate("intern", "fullName email mobile dob")
      .sort({ submittedAt: -1 })
      .lean();

    if (!feedbacks || feedbacks.length === 0) {
      return res.status(404).json({ message: "No feedbacks found for the selected IDs" });
    }

    // -----------------------------
    // 🧾 Prepare Data for Export
    // -----------------------------
    const exportData = feedbacks.map((fb, index) => {
      const intern = fb.intern || {};
      const internshipInfo = fb.internshipInfo || {};
      const media = fb.media || {};
      const internDetails = fb.internDetails || {};

      // Use internDetails as fallback if intern population fails
      const internName = intern.fullName || internDetails.fullName || 'N/A';
      const internEmail = intern.email || internDetails.email || 'N/A';
      const internMobile = intern.mobile || internDetails.mobile || 'N/A';
      const internDob = intern.dob || internDetails.dob || 'N/A';

      const baseData = {
        'SR No.': index + 1,
        'Certificate Number': internshipInfo.certificateNumber || 'Not Available',
        'Unique ID': fb.uniqueId || 'N/A',
        'Intern Name': internName,
        'Email': internEmail,
        'Mobile': internMobile,
        'Date of Birth': internDob,
        'Domain': internshipInfo.domain || 'N/A',
        'Duration': internshipInfo.duration || 'N/A',
        'Start Month': internshipInfo.startMonth || 'N/A',
        'End Month': internshipInfo.endMonth || 'N/A',
        'Submitted Date': fb.submittedAt ? new Date(fb.submittedAt).toLocaleDateString('en-IN') : 'N/A',
        'Submitted Time': fb.submittedAt ? new Date(fb.submittedAt).toLocaleTimeString('en-IN') : 'N/A',
      };

      // Conditionally add fields based on options
      if (options.includeText) {
        baseData['Feedback Text'] = fb.feedbackText || 'No feedback provided';
      }

      if (options.includePhotos) {
        baseData['Photo URL'] = media.photoUrl || 'No photo available';
      }

      if (options.includeVideos) {
        baseData['Video URL'] = media.videoUrl || 'No video available';
      }

      if (options.includeCertificate) {
        baseData['Certificate Number'] = internshipInfo.certificateNumber || 'Not Available';
        baseData['Date of Birth'] = internDob;
      }

      return baseData;
    });

    // -----------------------------
    // 📦 Generate File
    // -----------------------------
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    if (options.format === "csv") {
      // ✅ Export as CSV
      try {
        const { Parser } = require('json2csv');
        const parser = new Parser({
          fields: Object.keys(exportData[0]),
          delimiter: ',',
          quote: '"',
          escape: '"'
        });

        const csv = parser.parse(exportData);

        res.header("Content-Type", "text/csv; charset=utf-8");
        res.header("Content-Disposition", `attachment; filename="intern-feedbacks-${timestamp}.csv"`);
        res.header("X-Content-Type-Options", "nosniff");

        return res.send('\uFEFF' + csv); // BOM for Excel compatibility
      } catch (csvError) {
        console.error("CSV Generation Error:", csvError);
        return res.status(500).json({ message: "Failed to generate CSV file" });
      }

    } else {
      // ✅ Export as Excel (.xlsx) - Default
      try {
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Intern Management System';
        workbook.created = new Date();

        const sheet = workbook.addWorksheet("Intern Feedbacks", {
          properties: { tabColor: { argb: 'FF3B82F6' } }
        });

        // Define columns with appropriate widths
        sheet.columns = [
          { header: 'SR No.', key: 'SR No.', width: 8 },
          { header: 'Certificate Number', key: 'Certificate Number', width: 25 },
          { header: 'Unique ID', key: 'Unique ID', width: 15 },
          { header: 'Intern Name', key: 'Intern Name', width: 25 },
          { header: 'Email', key: 'Email', width: 30 },
          { header: 'Mobile', key: 'Mobile', width: 15 },
          { header: 'Date of Birth', key: 'Date of Birth', width: 12 },
          { header: 'Domain', key: 'Domain', width: 20 },
          { header: 'Duration', key: 'Duration', width: 12 },
          { header: 'Start Month', key: 'Start Month', width: 12 },
          { header: 'End Month', key: 'End Month', width: 12 },
          { header: 'Submitted Date', key: 'Submitted Date', width: 12 },
          { header: 'Submitted Time', key: 'Submitted Time', width: 12 },
          ...(options.includeText ? [{ header: 'Feedback Text', key: 'Feedback Text', width: 50 }] : []),
          ...(options.includePhotos ? [{ header: 'Photo URL', key: 'Photo URL', width: 40 }] : []),
          ...(options.includeVideos ? [{ header: 'Video URL', key: 'Video URL', width: 40 }] : [])
        ];

        // Add data rows
        sheet.addRows(exportData);

        // Style header row
        const headerRow = sheet.getRow(1);
        headerRow.height = 25;
        headerRow.eachCell((cell) => {
          cell.font = {
            bold: true,
            color: { argb: "FFFFFFFF" },
            size: 11
          };
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF3B82F6" } // blue
          };
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
          cell.alignment = {
            vertical: "middle",
            horizontal: "center",
            wrapText: true
          };
        });

        // Style data rows
        for (let i = 2; i <= sheet.rowCount; i++) {
          const row = sheet.getRow(i);
          row.height = 20;
          row.eachCell((cell) => {
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' }
            };
            cell.font = { size: 10 };
            // Align SR No. and dates to center
            if (cell.col === 1 || cell.value === 'SR No.' || cell.value.includes('Date') || cell.value.includes('Time')) {
              cell.alignment = { vertical: 'middle', horizontal: 'center' };
            } else {
              cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
            }
          });
        }

        // Freeze header row
        sheet.views = [{ state: 'frozen', ySplit: 1 }];

        // Auto-filter on header row
        sheet.autoFilter = {
          from: 'A1',
          to: `${String.fromCharCode(65 + sheet.columnCount - 1)}1`
        };

        // Set response headers
        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="intern-feedbacks-${timestamp}.xlsx"`
        );
        res.setHeader("X-Content-Type-Options", "nosniff");

        await workbook.xlsx.write(res);
        res.end();

      } catch (excelError) {
        console.error("Excel Generation Error:", excelError);
        return res.status(500).json({ message: "Failed to generate Excel file" });
      }
    }

  } catch (error) {
    console.error("❌ Export Feedbacks Error:", error);

    // More specific error messages
    if (error.name === 'CastError') {
      return res.status(400).json({ message: "Invalid feedback ID format" });
    }

    if (error.code === 'ETIMEDOUT') {
      return res.status(504).json({ message: "Export request timed out" });
    }

    res.status(500).json({
      message: "Export failed due to server error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export class CertificateGenerator {
  // 🆔 Generate auto-incremented certificate number (Fixed)
  static async generateCertificateNumber() {
    try {
      let newNumber;
      let isDuplicate = true;

      // Keep generating until a unique one is found
      while (isDuplicate) {
        // 🔹 Generate a random 9-digit number starting with 10016
        const randomPart = Math.floor(100000 + Math.random() * 899999); // 6 random digits
        newNumber = `100${randomPart}`; // e.g. 1001653842 (total 9 digits)

        // 🔍 Check in DB if it already exists
        const existing = await Intern.findOne({ certificateNumber: newNumber });
        if (!existing) isDuplicate = false;
      }

      return newNumber;
    } catch (error) {
      console.error("❌ Error generating certificate number:", error);
      // Fallback — unique pattern
      return `100${Date.now().toString().slice(-6)}`;
    }
  }

  // ✅ Check if certificate already exists
  static async getExistingCertificate(internEmail) {
    return await Intern.findOne({
      email: internEmail,
      certificateNumber: { $exists: true, $ne: null },
    });
  }

  // 🎓 Generate certificate using stored PNG template
  static async generateCertificate(internData) {
    try {
      if (!internData.certificateNumber) {
        throw new Error("Certificate number is required but was not provided");
      }

      // ✅ Template path
      const templatePath = path.join(process.cwd(), "public", "templates", "certificate-template.png");
      if (!fs.existsSync(templatePath)) {
        throw new Error(`Certificate template not found at: ${templatePath}`);
      }
      const templateImage = fs.readFileSync(templatePath);

      // ✅ Load font
      const fontPath = path.join(process.cwd(), "public", "fonts", "Rancho-Regular.ttf");
      if (!fs.existsSync(fontPath)) {
        throw new Error(`Font not found at: ${fontPath}`);
      }
      const pacificoFontBytes = fs.readFileSync(fontPath);

      // ✅ Create PDF and register fontkit
      const pdfDoc = await PDFDocument.create();
      pdfDoc.registerFontkit(fontkit);

      // ✅ Add page (A4 Landscape)
      const page = pdfDoc.addPage([842, 595]);

      // ✅ Embed background image
      const image = await pdfDoc.embedPng(templateImage);
      page.drawImage(image, {
        x: 0,
        y: 0,
        width: 842,
        height: 595,
      });

      // ✅ Embed fonts
      const pacificoFont = await pdfDoc.embedFont(pacificoFontBytes);
      const defaultFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      // 1️⃣ Intern Name — Pacifico
      const name = internData.fullName || "";
      const nameWidth = this.getTextWidth(name, pacificoFont, 58);
      page.drawText(name, {
        x: 490 - nameWidth / 2,
        y: 283,
        size: 65,
        font: pacificoFont,
        color: rgb(0, 0, 0),
      });

      // 2️⃣ Completion Text — Default font
      const line1 = `Has completed the internship program from ${internData.startMonth} to ${internData.endMonth}`;
      const line2 = ` showing exceptional dedication, professionalism, and contributions`;
      const line3 = `in the ${internData.domain} Department at Athenura.  `;


      const lines = [line1, line2, line3];

      const fontSize = 14.5;
      const lineHeight = 22;

      // Center block vertically
      const totalTextHeight = lines.length * lineHeight;
      const startY = 230 + totalTextHeight / 2 - lineHeight;

      lines.forEach((line, index) => {
        const lineWidth = this.getTextWidth(line, defaultFont, fontSize);

        page.drawText(line, {
          x: 485 - lineWidth / 2,
          y: startY - index * lineHeight,
          size: fontSize,
          font: defaultFont,
          color: rgb(0, 0, 0),
        });
      });


      // 3️⃣ Certificate ID — Bold
      page.drawText(`Certificate ID: ${internData.certificateNumber}`, {
        x: 150,
        y: 27,
        size: 10,
        font: boldFont,
        color: rgb(0, 0, 0),
      });

      // 4️⃣ Unique ID — Bold
      page.drawText(`Unique ID: ${internData.uniqueId}`, {
        x: 530,
        y: 27,
        size: 10,
        font: boldFont,
        color: rgb(0, 0, 0),
      });

      const pdfBytes = await pdfDoc.save();
      return Buffer.from(pdfBytes);
    } catch (error) {
      console.error("❌ Certificate generation error:", error);
      throw new Error(`Failed to generate certificate: ${error.message}`);
    }
  }

  // Helper function to calculate text width
  static getTextWidth(text, font, fontSize) {
    return text.length * (fontSize * 0.6);
  }

  // Helper function to split long text into multiple lines
  static splitTextIntoLines(text, font, fontSize, maxWidth) {
    const words = text.split(" ");
    const lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = font.widthOfTextAtSize(currentLine + " " + word, fontSize);
      if (width < maxWidth) {
        currentLine += " " + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);
    return lines;
  }

  // ✉️ Send certificate email
  static async sendCertificateEmail(internEmail, internName, certificateBuffer, internData) {
    try {
      const subject = `🎓 Your Internship Completion Certificate - ${internName}`;
      const certificateBase64 = certificateBuffer.toString("base64");

      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; }
    .header { background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { padding: 20px; }
    .footer { text-align: center; padding: 20px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>🎓 Congratulations ${internName}!</h2>
      <p>Your Internship Certificate is Ready</p>
    </div>
    <div class="content">
      <p>Dear <strong>${internName}</strong>,</p>
      <p>Congratulations on successfully completing your internship at <strong>Athenura</strong></p>
      <p>Your certificate is attached to this email. You can download and share it on professional platforms like LinkedIn.</p>
      <ul>
        <li>Certificate ID: ${internData.certificateNumber}</li>
        <li>Unique ID: ${internData.uniqueId}</li>
        <li>Domain: ${internData.domain}</li>
        <li>Duration: ${internData.duration}</li>
        <li>Period: ${internData.startMonth} to ${internData.endMonth}</li>
      </ul>
    </div>
    <div class="footer">
      <p>Best regards,<br>Team Athenura</p>
    </div>
  </div>
</body>
</html>`;

      const emailData = {
        sender: { name: "Athenura", email: process.env.FROM_EMAIL },
        to: [{ email: internEmail }],
        subject,
        htmlContent,
        attachment: [
          {
            name: `Certificate_${internName.replace(/\s+/g, "_")}.pdf`,
            content: certificateBase64,
          },
        ],
      };

      const response = await axios.post("https://api.brevo.com/v3/smtp/email", emailData, {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
        },
      });

      console.log("✅ Certificate email sent successfully");
      return response.data;
    } catch (error) {
      console.error("❌ Email sending error:", error.response?.data || error.message);
      throw new Error(`Failed to send certificate email: ${error.message}`);
    }
  }

  // ✉️ Send rejection email
  static async sendRejectionEmail(internEmail, internName, feedbackId, rejectionReason = null) {
    try {
      const subject = `📝 Update Regarding Your Internship Certificate Request`;

      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; }
    .header { background: linear-gradient(135deg, #ff6b6b, #ff8e53); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { padding: 20px; }
    .footer { text-align: center; padding: 20px; color: #666; }
    .reason-box { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 15px 0; }
    .action-box { background-color: #e7f3ff; border-left: 4px solid #0d6efd; padding: 15px; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>📝 Certificate Request Update</h2>
      <p>Action required to proceed further</p>
    </div>
    <div class="content">
      <p>Dear <strong>${internName}</strong>,</p>

      <p>We have reviewed your request for an internship completion certificate at <strong>Athenura</strong></p>

      <p>After careful review, we found that your submission requires corrections. Therefore, your certificate request <strong>has not been approved at this time</strong>.</p>

      ${rejectionReason ? `
      <div class="reason-box">
        <h4>Feedback / Reason:</h4>
        <p>${rejectionReason}</p>
      </div>
      ` : ''}

      <div class="action-box">
        <h4>Required Action:</h4>
        <p>Please <strong>fill out and submit the feedback form again</strong> by addressing the points mentioned above.  
        Your certificate request will be reconsidered once the updated feedback is reviewed.</p>
      </div>

      <p><strong>Next Steps:</strong></p>
      <ul>
        <li>Review the feedback carefully</li>
        <li>Re-submit the feedback form with correct details</li>
        <li>Request ID: <strong>${feedbackId}</strong></li>
      </ul>

      <p>If you believe there has been any mistake or need clarification, please contact your supervisor or support team.</p>
    </div>
    <div class="footer">
      <p>Best regards,<br><strong>Team Athenura</strong></p>
    </div>
  </div>
</body>
</html>`;


      const emailData = {
        sender: { name: "Athenura", email: process.env.FROM_EMAIL },
        to: [{ email: internEmail }],
        subject,
        htmlContent,
      };

      const response = await axios.post("https://api.brevo.com/v3/smtp/email", emailData, {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
        },
      });

      console.log("✅ Rejection email sent successfully");
      return response.data;
    } catch (error) {
      console.error("❌ Rejection email sending error:", error.response?.data || error.message);
      throw new Error(`Failed to send rejection email: ${error.message}`);
    }
  }

  // ✉️ Send pending/under review email
  static async sendPendingEmail(internEmail, internName, feedbackId) {
    try {
      const subject = `⏳ Your Certificate Request is Under Review`;

      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; }
    .header { background: linear-gradient(135deg, #4facfe, #00f2fe); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { padding: 20px; }
    .footer { text-align: center; padding: 20px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>⏳ Certificate Request Under Review</h2>
      <p>Your request is being processed</p>
    </div>
    <div class="content">
      <p>Dear <strong>${internName}</strong>,</p>
      <p>Thank you for submitting your internship certificate request to <strong>Athenura</strong></p>
      
      <p>This is to inform you that your request is currently <strong>under review</strong> by our team.</p>
      
      <p><strong>Request Details:</strong></p>
      <ul>
        <li>Request ID: ${feedbackId}</li>
        <li>Status: Under Review</li>
        <li>Review Timeline: 3-5 business days</li>
      </ul>
      
      <p>You will receive another email once the review process is complete with the final status of your request.</p>
      
      <p>We appreciate your patience during this process.</p>
    </div>
    <div class="footer">
      <p>Best regards,<br>Team Athenura</p>
    </div>
  </div>
</body>
</html>`;

      const emailData = {
        sender: { name: "Athenura", email: process.env.FROM_EMAIL },
        to: [{ email: internEmail }],
        subject,
        htmlContent,
      };

      const response = await axios.post("https://api.brevo.com/v3/smtp/email", emailData, {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
        },
      });

      console.log("✅ Pending email sent successfully");
      return response.data;
    } catch (error) {
      console.error("❌ Pending email sending error:", error.response?.data || error.message);
      throw new Error(`Failed to send pending email: ${error.message}`);
    }
  }
}

export const updateCertificateStatus = async (req, res) => {
  try {
    const { feedbackId } = req.params;
    const { certificateStatus, rejectionReason } = req.body;

    // First, get the current feedback to find the intern's uniqueId
    const currentFeedback = await Feedback.findById(feedbackId);
    if (!currentFeedback) {
      return res.status(404).json({ message: "Feedback not found." });
    }

    const previousStatus = currentFeedback.certificateStatus;
    const uniqueId = currentFeedback.uniqueId;
    const internEmail = currentFeedback.internDetails?.email;
    const internName = currentFeedback.internDetails?.fullName;

    // Update the feedback status
    const updatedFeedback = await Feedback.findByIdAndUpdate(
      feedbackId,
      { certificateStatus, ...(rejectionReason && { rejectionReason }) },
      { new: true, runValidators: true }
    );

    // 📧 Send email based on status change
    if (certificateStatus !== previousStatus) {
      try {
        if (certificateStatus === 'issued' && previousStatus !== 'issued') {
          // 🔥 AUTO-GENERATE CERTIFICATE when status changes to "issued"
          const certificateNumber = await CertificateGenerator.generateCertificateNumber();

          // Get intern data from feedback
          const internData = {
            fullName: updatedFeedback.internDetails?.fullName,
            email: updatedFeedback.internDetails?.email,
            startMonth: updatedFeedback.internshipInfo?.startMonth,
            endMonth: updatedFeedback.internshipInfo?.endMonth,
            domain: updatedFeedback.internshipInfo?.domain,
            duration: updatedFeedback.internshipInfo?.duration,
            uniqueId: updatedFeedback.uniqueId,
            certificateNumber: certificateNumber
          };

          // Generate certificate PDF
          const certificateBuffer = await CertificateGenerator.generateCertificate(internData);

          // Send certificate via email
          await CertificateGenerator.sendCertificateEmail(
            internData.email,
            internData.fullName,
            certificateBuffer,
            internData
          );

          // ✅ Update the feedback with certificate number
          await Feedback.findByIdAndUpdate(
            feedbackId,
            {
              'internshipInfo.certificateNumber': certificateNumber,
              certificateIssuedAt: new Date()
            },
            { new: true }
          );

          // ✅ ALSO update the Intern model with certificate info
          if (uniqueId) {
            await Intern.findOneAndUpdate(
              { uniqueId: uniqueId },
              {
                certificateNumber: certificateNumber,
                certificateIssuedAt: new Date(),
                certificateStatus: 'issued'
              },
              { new: true }
            );
          }
        }
        else if (certificateStatus === 'rejected') {
          // 📧 Send rejection email
          await CertificateGenerator.sendRejectionEmail(
            internEmail,
            internName,
            feedbackId,
            rejectionReason
          );

          // Update Intern model status
          if (uniqueId) {
            await Intern.findOneAndUpdate(
              { uniqueId: uniqueId },
              {
                certificateStatus: 'rejected',
                rejectionReason: rejectionReason,
                rejectedAt: new Date()
              },
              { new: true }
            );
          }
        }
        else if (certificateStatus === 'pending') {
          // 📧 Send pending/under review email
          await CertificateGenerator.sendPendingEmail(
            internEmail,
            internName,
            feedbackId
          );

          // Update Intern model status
          if (uniqueId) {
            await Intern.findOneAndUpdate(
              { uniqueId: uniqueId },
              {
                certificateStatus: 'pending'
              },
              { new: true }
            );
          }
        }
      } catch (emailError) {
        console.error('❌ Email sending failed:', emailError);
        // Don't fail the entire request if email sending fails
      }
    }

    // ✅ Fetch the final updated feedback to ensure we have the latest data
    const finalFeedback = await Feedback.findById(feedbackId);

    res.status(200).json({
      success: true,
      feedback: {
        _id: finalFeedback._id,
        certificateStatus: finalFeedback.certificateStatus,
        certificateNumber: finalFeedback.internshipInfo?.certificateNumber,
        internDetails: finalFeedback.internDetails,
        internshipInfo: finalFeedback.internshipInfo,
        uniqueId: finalFeedback.uniqueId,
        rejectionReason: finalFeedback.rejectionReason
      }
    });

  } catch (error) {
    console.error("❌ Error updating certificate status:", error);
    res.status(500).json({ message: "Server error: " + error.message });
  }
};


export const deleteFeedback = async (req, res) => {
  try {
    const { id } = req.params; // feedbackId from URL

    // Check exists
    const feedback = await Feedback.findById(id);
    if (!feedback) {
      return res.status(404).json({ message: "Feedback not found" });
    }

    // Delete
    await Feedback.findByIdAndDelete(id);

    return res.status(200).json({
      message: "Feedback deleted successfully",
      deletedId: id
    });

  } catch (error) {
    console.error("Delete Feedback Error:", error);
    return res.status(500).json({
      message: "Server error while deleting feedback",
      error: error.message
    });
  }
};
