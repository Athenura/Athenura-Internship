
import { PDFDocument, rgb } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import Intern from "../models/InternDatabase.js"
import InternIncharge from '../models/InternHead.js';
import Leave from '../models/LeaveDB.js'
import nodemailer from "nodemailer"
import { sendEmail } from '../config/emailConfig.js';
import User from "../models/UserDB.js"
import Setting from "../models/SettingDB.js"
import bcrypt from "bcrypt"
import * as fontkit from "fontkit"; // import fontkit
import axios from "axios"

import Attendance from "../models/Attendance.js"

export const getAllInterns = async (req, res) => {
  try {
    const { search = "", status, performance } = req.query;

    // 🧠 Build query dynamically
    const searchQuery = {};

    // 🎯 Status filter (if provided)
    if (status) {
      searchQuery.status = status;
    }

    // 🎯 Performance filter (if provided)
    if (performance) {
      searchQuery.performance = performance;
    } else {
      // Default: exclude "Average" performance
      searchQuery.performance = { $nin: ["Average"] };
    }

    // 🔍 Search filter
    if (search.trim() !== "") {
      const regex = new RegExp(search, "i"); // faster and cleaner
      searchQuery.$or = [
        { fullName: regex },
        { email: regex },
        { domain: regex },
        { college: regex },
        { course: regex },
        { educationLevel: regex },
        { uniqueId: regex },
        { mobile: regex },
      ];
    }

    // ⚡ Optimized MongoDB query
    const interns = await Intern.find(searchQuery)
      .sort({ createdAt: -1 })

    // 🧮 Use countDocuments instead of interns.length for large collections
    const total = await Intern.countDocuments(searchQuery);

    // ✅ Response
    res.status(200).json({
      success: true,
      total,
      interns,
    });
  } catch (error) {
    console.error("❌ Error in fetching interns:", error);
    res.status(500).json({ message: "Server error. Try again later." });
  }
};


export const DeleteRejectedInterns = async (req, res) => {
  try {
    const result = await Intern.deleteMany({ status: 'Rejected' });
    res.status(200).json({
      success: true,
      deletedCount: result.deletedCount,
      message: `Successfully deleted ${result.deletedCount} rejected interns`
    });
  } catch (error) {
    console.error('Error deleting rejected interns:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete rejected interns'
    });
  }
}


export const getInternById = async (req, res) => {
  try {
    const intern = await Intern.findById(req.params.id)
      .populate("updatedByHR", "fullName email role"); // 👈 populate HR info

    if (!intern) {
      return res.status(404).json({ message: "Intern not found" });
    }

    res.status(200).json(intern);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const intern = await Intern.findById(id);
    if (!intern) return res.status(404).json({ message: "Intern not found" });

    // Check if trying to set to Active/Inactive/Completed without required fields
    if (["Active", "Inactive", "Completed"].includes(status)) {
      if (!intern.joiningDate) {
        return res.status(400).json({
          message: "Cannot set status to Active/Inactive/Completed without joining date. Please generate offer letter first."
        });
      }
      if (!intern.uniqueId) {
        return res.status(400).json({
          message: "Cannot set status to Active/Inactive/Completed without unique ID. Please generate offer letter first."
        });
      }
    }

    // ✅ If intern is selected and joiningDate is not yet generated
    if (status === "Selected" && !intern.joiningDate) {
      const joinDate = new Date();
      intern.joiningDate = joinDate.toISOString(); // store as string
      intern.status = "Active"; // internship starts
    } else if (status) {
      // Update other statuses manually
      intern.status = status;
    }

    await intern.save();
    res.status(200).json({ message: "Status updated successfully", intern });
  } catch (err) {
    res.status(500).json({ message: "Failed to update status" });
  }
};


// Update intern performance
export const updatePerformance = async (req, res) => {
  try {
    const { id } = req.params;
    const { performance } = req.body;

    const intern = await Intern.findByIdAndUpdate(
      id,
      { performance },
      { new: true }
    );

    if (!intern) return res.status(404).json({ message: "Intern not found" });

    res
      .status(200)
      .json({ message: "Performance updated successfully", intern });
  } catch (err) {
    res.status(500).json({ message: "Failed to update performance" });
  }
};

// Update intern domain
export const updateDomain = async (req, res) => {
  try {
    const { id } = req.params;
    const { domain } = req.body;
    const intern = await Intern.findByIdAndUpdate(
      id,
      { domain },
      { new: true }
    );
    if (!intern) return res.status(404).json({ message: "Intern not found" });

    res.status(200).json({ message: "Domain updated successfully", intern });
  } catch (err) {
    res.status(500).json({ message: "Failed to update domain" });
  }
};


export const deleteIntern = async (req, res) => {
  try {
    const { id } = req.params;
    const intern = await Intern.findByIdAndDelete(id);
    if (!intern) return res.status(404).json({ message: "Intern not found" });
    res.status(200).json({ message: "Intern deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete intern" });
  }
};


const generateUniqueId = async () => {
  const currentDate = new Date();
  let candidateId;
  let exists = true;

  while (exists) {
    candidateId = `GRAPHURA/${currentDate.getFullYear().toString().slice(2)}/${(
      currentDate.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}/${Math.floor(100 + Math.random() * 900)}`;

    // Check if this ID already exists
    const existing = await Intern.findOne({ uniqueId: candidateId });
    if (!existing) exists = false;
  }

  return candidateId;
};

export const generateOfferLetterWithPNG = async (req, res) => {
  try {
    const { id } = req.params;
    const { joiningDate } = req.body;

    // 1️⃣ Find the intern
    const intern = await Intern.findById(id);
    if (!intern) return res.status(404).json({ error: "Intern not found" });

    if (intern.status !== "Selected")
      return res
        .status(400)
        .json({ error: "Offer letter can only be generated for selected interns" });

    if (!joiningDate)
      return res
        .status(400)
        .json({ error: "Joining date is required to generate offer letter" });

    // Update joining date
    intern.joiningDate = new Date(joiningDate);

    // 2️⃣ Generate uniqueId if not already present
    if (!intern.uniqueId) {
      intern.uniqueId = await generateUniqueId();
    }

    await intern.save();

    const pdfDoc = await PDFDocument.create();

    // 3️⃣ Create PDF
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 size

    const backgroundPath = path.join(
      process.cwd(),
      "public",
      "templates",
      "GRAPHURAOFFERLETTERS.png"
    );

    if (!fs.existsSync(backgroundPath)) {
      return res.status(404).json({ error: "Background PNG not found" });
    }

    const backgroundImageBytes = fs.readFileSync(backgroundPath);
    const backgroundImage = await pdfDoc.embedPng(backgroundImageBytes);

    page.drawImage(backgroundImage, {
      x: 0,
      y: 0,
      width: 595.28,
      height: 841.89,
    });

    const formattedJoiningDate = new Date(joiningDate).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    // 4️⃣ REGISTER FONTKIT BEFORE EMBEDDING CUSTOM FONT
    pdfDoc.registerFontkit(fontkit);

    const jostRegularPath = path.join(process.cwd(), "public", "fonts", "Jost-Regular.ttf");
    const jostBoldPath = path.join(process.cwd(), "public", "fonts", "Jost-Bold.ttf");

    const font = await pdfDoc.embedFont(fs.readFileSync(jostRegularPath));
    const fontBold = await pdfDoc.embedFont(fs.readFileSync(jostBoldPath));

    let y = 635;
    page.drawText("GRAPHURA INDIA PRIVATE LIMITED", {
      x: 60,
      y,
      size: 15,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    y -= 20;
    page.drawText("Gurgaon, Haryana.", {
      x: 60,
      y,
      size: 14,
      font,
      color: rgb(0, 0, 0),
    });

    y -= 60;
    page.drawText(`To,`, { x: 60, y, size: 13, font, color: rgb(0, 0, 0) });
    y -= 20;
    page.drawText(`${intern.fullName}`, {
      x: 60,
      y,
      size: 14,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    y -= 15;
    page.drawText(`${intern.domain} Department`, {
      x: 60,
      y,
      size: 14,
      font,
      color: rgb(0, 0, 0),
    });

    y -= 40;
    page.drawText(
      "Subject: Offer of Internship at Graphura India Private Limited",
      { x: 60, y, size: 13, font, color: rgb(0, 0, 0) }
    );

    y -= 35;
    page.drawText(`Dear ${intern.fullName},`, {
      x: 60,
      y,
      size: 14,
      font,
      color: rgb(0, 0, 0),
    });

    y -= 20;
    const textLines = [
      `We are delighted to offer you the position of Intern at Graphura India Private`,
      `Limited, starting from ${formattedJoiningDate}. We were impressed with your skills and`,
      "believe that your contribution will add value to our team.",
      "",
      "We look forward to welcoming you aboard and are excited about the journey",
      "ahead. Please feel free to reach out if you have any questions before your start",
      "date. Together, let's create impactful work and grow as a team. Once again,",
      "congratulations and welcome to Graphura India Private Limited.",
    ];

    textLines.forEach((line) => {
      page.drawText(line, { x: 60, y, size: 14, font, color: rgb(0, 0, 0) });
      y -= 15;
    });

    y -= 25;
    page.drawText("Thank you", { x: 60, y, size: 14, font: fontBold });
    y -= 15;
    page.drawText("Team Graphura.", { x: 60, y, size: 14, font: fontBold });

    y -= 95;
    page.drawText("Unique ID:", { x: 75, y, size: 14, font: fontBold });
    y -= 15;
    page.drawText(intern.uniqueId, { x: 75, y, size: 14, font: fontBold });

    y -= 15;
    page.drawText("Date:", { x: 75, y, size: 14, font: fontBold });
    page.drawText(formattedJoiningDate, { x: 115, y, size: 14, font });

    // 5️⃣ Generate PDF bytes
    const pdfBytes = await pdfDoc.save();

    const fileName = `OfferLetter-${intern.fullName.replace(/\s+/g, "_")}.pdf`;

    // Email content
    const emailText = `Dear ${intern.fullName},

Congratulations and a warm welcome to Graphura India Private Limited.

We’re delighted to have you onboard as an intern. Your internship is scheduled to commence on ${formattedJoiningDate}. During this period, you will gain valuable industry exposure, enhance your professional skills, and contribute meaningfully to assigned projects. Upon successful completion, you will be awarded a Certificate of Internship from Graphura India Private Limited.

We kindly request you to review the attached document carefully.

If you have any queries, feel free to reach out to the HR Department.

Best regards,
HR Department
Graphura India Private Limited
📧 Official@graphura.in
🌐 www.graphura.online
🔗 LinkedIn: <a href="https://www.linkedin.com/company/graphura-india-private-limited/">Graphura India Private Limited</a>
`;



    // 6️⃣ Send Email with PDF attachment using Brevo API
    try {
      await axios.post(
        "https://api.brevo.com/v3/smtp/email",
        {
          sender: { name: "Graphura", email: process.env.FROM_EMAIL },
          to: [{ email: intern.email }],
          subject: "Internship Offer Letter – Graphura India Private Limited",
          htmlContent: `<pre style="font-family:inherit;">${emailText}</pre>`,
          attachment: [
            {
              name: fileName,
              content: Buffer.from(pdfBytes).toString("base64"),
              type: "application/pdf",
              disposition: "attachment",
            },
          ],
        },
        {
          headers: {
            "api-key": process.env.BREVO_API_KEY,
            "Content-Type": "application/json",
          },
        }
      );
    } catch (emailError) {
      console.error("❌ Email send error:", emailError.response?.data || emailError.message);
      // Continue even if email fails - still send the PDF as response
    }

    // 7️⃣ Send PDF as response
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.send(Buffer.from(pdfBytes));

  } catch (error) {
    console.error("Error generating offer letter:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};



// Add this function to your backend
export const BulkJoinDate = async (req, res) => {
  try {
    const { internIds, joiningDate } = req.body;

    await Intern.updateMany(
      { _id: { $in: internIds } },
      { $set: { joiningDate: joiningDate } }
    );

    res.json({ message: 'Joining dates updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update joining dates' });
  }
};

// Bulk Offer Letters Function
export const generateBulkOfferLetters = async (req, res) => {
  try {
    const { internIds, joiningDate } = req.body;

    if (!internIds || !Array.isArray(internIds) || internIds.length === 0) {
      return res.status(400).json({ error: "Intern IDs array is required" });
    }

    if (!joiningDate) {
      return res.status(400).json({ error: "Joining date is required" });
    }

    const results = {
      processed: 0,
      failed: 0,
      details: []
    };

    // Process interns sequentially
    for (const internId of internIds) {
      try {
        // 1️⃣ Find the intern
        const intern = await Intern.findById(internId);
        if (!intern) {
          results.details.push({
            internId,
            status: 'failed',
            error: 'Intern not found'
          });
          results.failed++;
          continue;
        }

        if (intern.status !== "Selected") {
          results.details.push({
            internId,
            status: 'failed',
            error: 'Intern not selected'
          });
          results.failed++;
          continue;
        }

        // 2️⃣ Generate uniqueId if not already present
        if (!intern.uniqueId) {
          intern.uniqueId = await generateUniqueId();
        }

        // 3️⃣ Update joining date
        intern.joiningDate = new Date(joiningDate);
        await intern.save();

        // 4️⃣ Generate PDF
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([595.28, 841.89]); // A4 size

        // Load background image
        const backgroundPath = path.join(
          process.cwd(),
          "public",
          "templates",
          "GRAPHURAOFFERLETTERS.png"
        );

        if (!fs.existsSync(backgroundPath)) {
          results.details.push({
            internId,
            status: 'failed',
            error: 'Background template not found'
          });
          results.failed++;
          continue;
        }

        const backgroundImageBytes = fs.readFileSync(backgroundPath);
        const backgroundImage = await pdfDoc.embedPng(backgroundImageBytes);

        page.drawImage(backgroundImage, {
          x: 0,
          y: 0,
          width: 595.28,
          height: 841.89,
        });

        const formattedJoiningDate = new Date(joiningDate).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });

        // Register fontkit and load fonts
        pdfDoc.registerFontkit(fontkit);

        const jostRegularPath = path.join(process.cwd(), "public", "fonts", "Jost-Regular.ttf");
        const jostBoldPath = path.join(process.cwd(), "public", "fonts", "Jost-Bold.ttf");

        // Check if fonts exist
        if (!fs.existsSync(jostRegularPath) || !fs.existsSync(jostBoldPath)) {
          results.details.push({
            internId,
            status: 'failed',
            error: 'Font files not found'
          });
          results.failed++;
          continue;
        }

        const font = await pdfDoc.embedFont(fs.readFileSync(jostRegularPath));
        const fontBold = await pdfDoc.embedFont(fs.readFileSync(jostBoldPath));

        // Draw text content
        let y = 635;
        page.drawText("GRAPHURA INDIA PRIVATE LIMITED", {
          x: 60,
          y,
          size: 15,
          font: fontBold,
          color: rgb(0, 0, 0),
        });
        y -= 20;
        page.drawText("Gurgaon, Haryana.", {
          x: 60,
          y,
          size: 14,
          font,
          color: rgb(0, 0, 0),
        });

        y -= 60;
        page.drawText(`To,`, { x: 60, y, size: 13, font, color: rgb(0, 0, 0) });
        y -= 20;
        page.drawText(`${intern.fullName}`, {
          x: 60,
          y,
          size: 14,
          font: fontBold,
          color: rgb(0, 0, 0),
        });
        y -= 15;
        page.drawText(`${intern.domain} Department`, {
          x: 60,
          y,
          size: 14,
          font,
          color: rgb(0, 0, 0),
        });

        y -= 40;
        page.drawText(
          "Subject: Offer of Internship at Graphura India Private Limited",
          { x: 60, y, size: 13, font, color: rgb(0, 0, 0) }
        );

        y -= 35;
        page.drawText(`Dear ${intern.fullName},`, {
          x: 60,
          y,
          size: 14,
          font,
          color: rgb(0, 0, 0),
        });

        y -= 20;
        const textLines = [
          `We are delighted to offer you the position of Intern at Graphura India Private`,
          `Limited, starting from ${formattedJoiningDate}. We were impressed with your skills and`,
          "believe that your contribution will add value to our team.",
          "",
          "We look forward to welcoming you aboard and are excited about the journey",
          "ahead. Please feel free to reach out if you have any questions before your start",
          "date. Together, let's create impactful work and grow as a team. Once again,",
          "congratulations and welcome to Graphura India Private Limited.",
        ];

        textLines.forEach((line) => {
          page.drawText(line, { x: 60, y, size: 14, font, color: rgb(0, 0, 0) });
          y -= 15;
        });

        y -= 25;
        page.drawText("Thank you", { x: 60, y, size: 14, font: fontBold });
        y -= 15;
        page.drawText("Team Graphura.", { x: 60, y, size: 14, font: fontBold });

        y -= 95;
        page.drawText("Unique ID:", { x: 75, y, size: 14, font: fontBold });
        y -= 15;
        page.drawText(intern.uniqueId, { x: 75, y, size: 14, font: fontBold });

        y -= 15;
        page.drawText("Date:", { x: 75, y, size: 14, font: fontBold });
        page.drawText(formattedJoiningDate, { x: 115, y, size: 14, font });

        // 5️⃣ Generate PDF bytes
        const pdfBytes = await pdfDoc.save();
        const fileName = `OfferLetter-${intern.fullName.replace(/\s+/g, "_")}-${intern.uniqueId.replace(/\//g, '_')}.pdf`;

        // 6️⃣ Send email using Brevo API (like your single offer letter function)
        if (process.env.BREVO_API_KEY && process.env.FROM_EMAIL) {


          const emailText = `Dear ${intern.fullName},

Congratulations and a warm welcome to Graphura India Private Limited.

We’re delighted to have you onboard as an intern. Your internship is scheduled to commence on ${formattedJoiningDate}. During this period, you will gain valuable industry exposure, enhance your professional skills, and contribute meaningfully to assigned projects. Upon successful completion, you will be awarded a Certificate of Internship from Graphura India Private Limited.

We kindly request you to review the attached document carefully.

If you have any queries, feel free to reach out to the HR Department.

Best regards,
HR Department
Graphura India Private Limited
📧 Official@graphura.in
🌐 www.graphura.online
🔗 LinkedIn: <a href="https://www.linkedin.com/company/graphura-india-private-limited/">Graphura India Private Limited</a>
`;

          try {
            await axios.post(
              "https://api.brevo.com/v3/smtp/email",
              {
                sender: { name: "Graphura", email: process.env.FROM_EMAIL },
                to: [{ email: intern.email }],
                subject: "Internship Offer Letter – Graphura India Private Limited",
                htmlContent: `<pre style="font-family:inherit;">${emailText}</pre>`,
                attachment: [
                  {
                    name: fileName,
                    content: Buffer.from(pdfBytes).toString("base64"),
                    type: "application/pdf",
                    disposition: "attachment",
                  },
                ],
              },
              {
                headers: {
                  "api-key": process.env.BREVO_API_KEY,
                  "Content-Type": "application/json",
                },
              }
            );
          } catch (emailError) {
            console.error(`❌ Email send error for ${intern.email}:`, emailError.response?.data || emailError.message);
            // Continue processing even if email fails
          }
        }

        results.processed++;
        results.details.push({
          internId,
          status: 'success',
          email: intern.email,
          uniqueId: intern.uniqueId,
          name: intern.fullName
        });

      } catch (error) {
        results.failed++;
        results.details.push({
          internId,
          status: 'failed',
          error: error.message
        });
      }
    }

    // Update status to Active for successfully processed interns
    const successfulInternIds = results.details
      .filter(detail => detail.status === 'success')
      .map(detail => detail.internId);

    if (successfulInternIds.length > 0) {
      await Intern.updateMany(
        { _id: { $in: successfulInternIds } },
        { $set: { status: "Active" } }
      );
    }

    res.json({
      success: true,
      message: `Bulk offer letter generation completed. Processed: ${results.processed}, Failed: ${results.failed}`,
      ...results
    });

  } catch (error) {
    console.error("Error in bulk offer letter generation:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message
    });
  }
};




export const updateJoiningDate = async (req, res) => {
  try {
    const { id } = req.params;
    const { joiningDate } = req.body;
    const intern = await Intern.findByIdAndUpdate(
      id,
      { joiningDate },
      { new: true }
    );
    if (!intern) return res.status(404).json({ message: "Intern not found" });

    res.status(200).json({ message: "Joining Date updated successfully", intern });
  } catch (err) {
    res.status(500).json({ message: "Failed to update domain" });
  }
};



export const updateDuration = async (req, res) => {
  try {
    const { id } = req.params;
    const { duration } = req.body;

    const intern = await Intern.findByIdAndUpdate(
      id,
      { duration },
      { new: true }
    );

    if (!intern) {
      return res.status(404).json({ message: "Intern not found" });
    }

    res.status(200).json({
      message: "Duration updated successfully",
      intern
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
}


export const InternIncharges = async (req, res) => {
  try {
    const incharges = await InternIncharge.find(); // exclude password
    res.status(200).json({ success: true, incharges });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
}

export const InchargeProfile = async (req, res) => {
  try {
    const { id } = req.params;
    // 1️⃣ Fetch incharge details
    const incharge = await InternIncharge.findById(id);

    if (!incharge) {
      return res.status(404).json({ message: "Incharge not found" });
    }

    // 2️⃣ Fetch students assigned under same departments
    const interns = await Intern.find({
      status: ["Active", "Inactive"],
      domain: { $in: incharge.departments },
    }).select("fullName email domain status joinDate");

    // 3️⃣ Respond
    res.status(200).json({
      message: "Incharge Fetched Successfully",
      Incharge: incharge,
      Interns: interns,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error in fetching incharge profile",
      error: error.message,
    });
  }
};



export const updateInchargeDepartments = async (req, res) => {
  try {
    const { id } = req.params;

    const { departments } = req.body;

    if (!Array.isArray(departments)) {
      return res.status(400).json({ message: "Departments must be an array" });
    }

    const incharge = await InternIncharge.findByIdAndUpdate(
      id,
      { departments },
      { new: true }
    );

    if (!incharge) {
      return res.status(404).json({ message: "Incharge not found" });
    }

    res.status(200).json({
      message: "Departments updated successfully",
      incharge,
    });
  } catch (error) {
    res.status(500).json({ message: "Error updating incharge departments" });
  }
};



export const removeInchargeDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { departments } = req.body;

    if (!Array.isArray(departments)) {
      return res.status(400).json({ message: "Departments must be an array" });
    }

    // Update incharge with new department list
    const incharge = await InternIncharge.findByIdAndUpdate(
      id,
      { departments },
      { new: true }
    );

    if (!incharge) {
      return res.status(404).json({ message: "Incharge not found" });
    }

    // Optionally unassign interns linked to the removed departments
    await Intern.updateMany(
      { domain: { $nin: incharge.departments } },
      { $unset: { inchargeId: "" } } // removes the inchargeId field
    );

    res.status(200).json({
      message: "Department removed successfully",
      incharge,
    });
  } catch (error) {
    res.status(500).json({ message: "Error removing department" });
  }
};



export const ToggleInchargeStatus = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the incharge by ID
    const incharge = await InternIncharge.findById(id);

    if (!incharge) {
      return res.status(404).json({ message: "Incharge not found" });
    }

    // Toggle status
    const newStatus = incharge.status === "Active" ? "Inactive" : "Active";
    incharge.status = newStatus;

    // Save the updated incharge
    await incharge.save();

    res.status(200).json({ message: `Incharge status updated to ${newStatus}`, incharge });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};



export const deleteIncharge = async (req, res) => {
  try {
    const { id } = req.params;

    const incharge = await InternIncharge.findByIdAndDelete(id);

    if (!incharge) {
      return res.status(404).json({ message: "Incharge not found" });
    }

    res.status(200).json({ message: "Incharge deleted successfully" });
  } catch (err) {
    res.status(500).json({
      message: "Error deleting incharge",
      error: err.message,
    });
  }
};

export const getHRManagers = async (req, res) => {
  try {
    // Fetch all users with role HR
    const hrUsers = await User.find({ role: "HR" });

    res.status(200).json({
      message: "HR Managers fetched successfully",
      totalHR: hrUsers.length,
      hrManagers: hrUsers // optional full data
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching HR managers", error: error.message });
  }
};


export const toggleHRStatus = async (req, res) => {
  try {
    const { hrId } = req.params;

    // Find the HR user by ID and ensure role is HR
    const hrUser = await User.findOne({ _id: hrId, role: "HR" });
    if (!hrUser) {
      return res.status(404).json({ message: "HR user not found" });
    }

    // Switch status
    hrUser.status = hrUser.status === "Active" ? "Inactive" : "Active";

    // Save changes
    await hrUser.save();

    res.status(200).json({
      message: `HR status updated to ${hrUser.status}`,
      hrUser
    });
  } catch (error) {
    res.status(500).json({ message: "Error updating HR status", error: error.message });
  }
};



export const deleteHR = async (req, res) => {
  try {
    const { hrId } = req.params;

    // Find HR user by ID and ensure role is HR
    const hrUser = await User.findOne({ _id: hrId, role: "HR" });

    if (!hrUser) {
      return res.status(404).json({ success: false, message: "HR user not found" });
    }

    // Delete HR user
    await User.findByIdAndDelete(hrId);

    res.status(200).json({ success: true, message: "HR user deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error deleting HR user", error: error.message });
  }
};

export const InchargeComments = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify the intern exists
    const intern = await Intern.findById(id)
    if (!intern) {
      return res.status(404).json({
        success: false,
        message: 'Intern not found'
      });
    }
    // Get comments from intern's comments array
    const inchargeComments = intern.comments || [];

    res.json({
      success: true,
      comments: inchargeComments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching incharge comments'
    });
  }
}



export const InchargeCommentsDetails = async (req, res) => {
  try {
    const { inchargeId } = req.params;
    const incharge = await InternIncharge.findById(inchargeId).select('fullName email');
    if (!incharge) {
      return res.status(404).json({
        success: false,
        message: 'Incharge not found'
      });
    }
    res.json({
      success: true,
      incharge
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching incharge details'
    });
  }
}



export const InchargeDeleteComments = async (req, res) => {
  try {
    const { id, commentId } = req.params;

    // Remove comment from intern's comments array
    await Intern.findByIdAndUpdate(
      id,
      { $pull: { comments: { _id: commentId } } },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while deleting comment'
    });
  }
}




export const GetApplication = async (req, res) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = await Setting.create({});
    }
    res.json({ settings });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
}



export const toggleApplicationStatus = async (req, res) => {
  try {
    const { isApplicationOpen, password } = req.body;

    // Verify admin password
    const admin = await User.findById(req.user.id);
    if (!admin) {
      return res.status(404).json({ error: "Admin not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid password" });
    }

    // Update existing settings
    const settings = await Setting.findOne();
    if (!settings) {
      return res.status(404).json({ error: "Settings not found" });
    }

    // Update the status
    settings.isApplicationOpen = isApplicationOpen !== undefined ? isApplicationOpen : !settings.isApplicationOpen;
    await settings.save();

    res.json({ message: "Application status updated successfully", settings });
  } catch (error) {
    res.status(500).json({ error: "Failed to update settings" });
  }
};



export const getHrCommentsForAdmin = async (req, res) => {
  try {
    const { id } = req.params; // Intern ID

    // Find intern and populate HR who commented
    const intern = await Intern.findById(id)
      .populate("hrComments.commentedBy", "fullName email role");

    if (!intern) {
      return res.status(404).json({ message: "Intern not found" });
    }

    res.status(200).json({
      message: "HR comments fetched successfully (Admin view)",
      hrComments: intern.hrComments || [],
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch HR comments" });
  }
};



export const getInternsWithAttendance = async (req, res) => {
  try {
    const { department, search, date, status } = req.query;

    let filter = {};

    // ✅ Only include Active, Inactive, Completed interns
    filter.status = { $in: ['Active', 'Inactive', 'Completed'] };

    // Department filter
    if (department) {
      filter.domain = department;
    }

    // Status filter (optional specific one)
    if (status && ['Active', 'Inactive', 'Completed'].includes(status)) {
      filter.status = status;
    }

    // Search filter
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { uniqueId: { $regex: search, $options: 'i' } }
      ];
    }

    // Get interns with filters
    const interns = await Intern.find(filter)
      .select('fullName email mobile uniqueId domain status performance joiningDate totalMeetings meetingsAttended leavesTaken')
      .sort({ domain: 1, fullName: 1 });

    // Add attendance data for each intern
    const internsWithAttendance = await Promise.all(
      interns.map(async (intern) => {
        let attendanceFilter = { intern: intern._id };

        if (date) {
          const startDate = new Date(date);
          const endDate = new Date(date);
          endDate.setDate(endDate.getDate() + 1);
          attendanceFilter.meetingDate = { $gte: startDate, $lt: endDate };
        }

        const attendanceRecords = await Attendance.find(attendanceFilter);

        const presentCount = attendanceRecords.filter(r => r.status === 'Present').length;
        const absentCount = attendanceRecords.filter(r => r.status === 'Absent').length;
        const leaveCount = attendanceRecords.filter(r => r.status === 'Leave').length;
        const totalRecords = attendanceRecords.length;

        const attendanceRate = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0;

        return {
          ...intern.toObject(),
          presentCount,
          absentCount,
          leaveCount,
          totalRecords,
          attendanceRate
        };
      })
    );

    // Department-level stats
    const departmentStats = {};
    const departments = [...new Set(interns.map(i => i.domain))];

    await Promise.all(
      departments.map(async (dept) => {
        const deptInterns = internsWithAttendance.filter(i => i.domain === dept);
        const deptInternIds = deptInterns.map(i => i._id);

        let attendanceFilter = { intern: { $in: deptInternIds } };
        if (date) {
          const startDate = new Date(date);
          const endDate = new Date(date);
          endDate.setDate(endDate.getDate() + 1);
          attendanceFilter.meetingDate = { $gte: startDate, $lt: endDate };
        }

        const deptAttendance = await Attendance.find(attendanceFilter);

        const totalPresent = deptAttendance.filter(r => r.status === 'Present').length;
        const totalAbsent = deptAttendance.filter(r => r.status === 'Absent').length;
        const totalLeave = deptAttendance.filter(r => r.status === 'Leave').length;
        const totalRecords = deptAttendance.length;

        const attendanceRate = totalRecords > 0 ? Math.round((totalPresent / totalRecords) * 100) : 0;

        departmentStats[dept] = {
          totalInterns: deptInterns.length,
          present: totalPresent,
          absent: totalAbsent,
          leave: totalLeave,
          attendanceRate
        };
      })
    );

    // Overall stats
    const allAttendance = await Attendance.find(date ? {
      meetingDate: {
        $gte: new Date(date),
        $lt: new Date(new Date(date).setDate(new Date(date).getDate() + 1))
      }
    } : {});

    const overallStats = {
      totalInterns: interns.length,
      totalPresent: allAttendance.filter(r => r.status === 'Present').length,
      totalAbsent: allAttendance.filter(r => r.status === 'Absent').length,
      totalLeave: allAttendance.filter(r => r.status === 'Leave').length,
      totalDepartments: departments.length,
      avgAttendance: allAttendance.length > 0
        ? Math.round((allAttendance.filter(r => r.status === 'Present').length / allAttendance.length) * 100)
        : 0
    };

    // ✅ Status summary
    const statusStats = {
      Active: interns.filter(i => i.status === 'Active').length,
      Inactive: interns.filter(i => i.status === 'Inactive').length,
      Completed: interns.filter(i => i.status === 'Completed').length
    };

    res.json({
      success: true,
      interns: internsWithAttendance,
      departmentStats,
      overallStats,
      statusStats
    });

  } catch (error) {
    console.error('Error fetching interns with attendance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch interns data'
    });
  }
};



export const getDepartments = async (req, res) => {
  try {
    const departments = await Intern.distinct('domain');
    res.json({
      success: true,
      departments: departments.filter(dept => dept) // Remove null/undefined
    });
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch departments'
    });
  }
};



// In your backend controller file
export const getLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find()
      .populate({
        path: 'internId',
        select: 'fullName email mobile domain status'
      })
      .sort({ createdAt: -1 });

    // ✅ remove leaves whose intern is deleted / not found
    const validLeaves = leaves.filter(leave => leave.internId !== null);

    res.json({
      success: true,
      leaves: validLeaves
    });

  } catch (error) {
    console.error('Error fetching leaves:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leaves'
    });
  }
};




export const approveLeave = async (req, res) => {
  try {
    const { leaveId } = req.params;

    const leave = await Leave.findById(leaveId).populate('internId');

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    // Update leave status
    leave.status = 'Approved';
    await leave.save();

    // Update intern's leave count
    await Intern.findByIdAndUpdate(leave.internId._id, {
      $inc: { leavesTaken: leave.totalDays }
    });

    // Send approval email (use the same email function from before)
    const subject = `Leave Request Approved - Graphura Internship Program`;
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .status-approved { background: #d4edda; color: #155724; padding: 10px; border-radius: 5px; text-align: center; font-weight: bold; }
          .details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Leave Request Approved</h1>
            <p>Graphura Internship Program</p>
          </div>
          <div class="content">
            <div class="status-approved">
              ✅ Your leave request has been approved
            </div>
            <div class="details">
              <h3>Leave Details:</h3>
              <p><strong>Intern Name:</strong> ${leave.internId.fullName}</p>
              <p><strong>Leave Type:</strong> ${leave.leaveType}</p>
              <p><strong>Duration:</strong> ${leave.totalDays} day(s)</p>
              <p><strong>From:</strong> ${new Date(leave.startDate).toLocaleDateString()}</p>
              <p><strong>To:</strong> ${new Date(leave.endDate).toLocaleDateString()}</p>
              <p><strong>Reason:</strong> ${leave.reason}</p>
              <p><strong>Approved On:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
            <p>Your leave has been approved by the Admin. Please ensure a smooth handover of your work before proceeding on leave.</p>
          </div>
          <div class="footer">
            <p>This is an automated notification from Graphura Internship Program.</p>
            <p>© ${new Date().getFullYear()} Graphura India Private Limited. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await sendEmail(leave.internId.email, subject, htmlContent);

    res.json({
      success: true,
      message: 'Leave approved successfully and email sent to intern'
    });
  } catch (error) {
    console.error('Error approving leave:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve leave'
    });
  }
}



export const rejectLeave = async (req, res) => {
  try {
    const { leaveId } = req.params;

    const leave = await Leave.findById(leaveId).populate('internId');

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    // Update leave status
    leave.status = 'Rejected';
    await leave.save();

    // Send rejection email
    const subject = `Leave Request Update - Graphura Internship Program`;
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .status-rejected { background: #f8d7da; color: #721c24; padding: 10px; border-radius: 5px; text-align: center; font-weight: bold; }
          .details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Leave Request Update</h1>
            <p>Graphura Internship Program</p>
          </div>
          <div class="content">
            <div class="status-rejected">
              ❌ Your leave request has been rejected
            </div>
            <div class="details">
              <h3>Leave Details:</h3>
              <p><strong>Intern Name:</strong> ${leave.internId.fullName}</p>
              <p><strong>Leave Type:</strong> ${leave.leaveType}</p>
              <p><strong>Duration:</strong> ${leave.totalDays} day(s)</p>
              <p><strong>From:</strong> ${new Date(leave.startDate).toLocaleDateString()}</p>
              <p><strong>To:</strong> ${new Date(leave.endDate).toLocaleDateString()}</p>
              <p><strong>Reason:</strong> ${leave.reason}</p>
              <p><strong>Status Updated On:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
            <p>Your leave request has been rejected by the Admin. Please contact the admin office for more details or clarification.</p>
          </div>
          <div class="footer">
            <p>This is an automated notification from Graphura Internship Program.</p>
            <p>© ${new Date().getFullYear()} Graphura India Private Limited. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await sendEmail(leave.internId.email, subject, htmlContent);

    res.json({
      success: true,
      message: 'Leave rejected successfully and email sent to intern'
    });
  } catch (error) {
    console.error('Error rejecting leave:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject leave'
    });
  }
}