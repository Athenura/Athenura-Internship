import Intern from '../models/InternDatabase.js';
import { sendEmail } from "../config/emailConfig.js"
import Setting from "../models/SettingDB.js"
import Performance from "../models/Performance.js"
import Leave from "../models/LeaveDB.js"

export const createIntern = async (req, res) => {
  try {
    const internData = req.body;

    // Validate required fields
    if (!internData.fullName || !internData.email || !internData.mobile) {
      return res.status(400).json({ message: "Full Name, Email and Mobile are required" });
    }

    // Check for existing email or mobile
    const existingEmail = await Intern.findOne({ email: internData.email });
    if (existingEmail) return res.status(400).json({ message: "Intern Application already exists" });

    const existingMobile = await Intern.findOne({ mobile: internData.mobile });
    if (existingMobile) return res.status(400).json({ message: "Intern Application already exists" });

    // Create new intern
    const newIntern = new Intern({
      fullName: internData.fullName,
      email: internData.email,
      mobile: internData.mobile,
      dob: internData.dob,
      gender: internData.gender,
      state: internData.state,
      city: internData.city,
      address: internData.address,
      pinCode: internData.pinCode,
      college: internData.college,
      course: internData.course,
      educationLevel: internData.educationLevel,
      domain: internData.domain,
      contactMethod: internData.contactMethod,
      resumeUrl: internData.resumeUrl,
      duration: internData.duration,
      prevInternship: internData.prevInternship,
      prevInternshipDesc: internData.prevInternshipDesc,
      TpoEmail: internData.TpoEmail,
      TpoNumber: internData.TpoNumber,
      TpoName: internData.TpoName,
    });

    await newIntern.save();

    // Email message (same as WhatsApp style)
    const emailMsg = `Dear ${newIntern.fullName},

Thank you for your interest in joining Athenura and submitting your application for the ${newIntern.domain} internship position.

📌 Internship Domain: ${newIntern.domain}
📌 Duration: ${newIntern.duration}

We have successfully received your application, and our recruitment team will carefully review your qualifications. We truly appreciate the time and effort you invested in your application.

🟢 Important Next Step:
To stay updated with important announcements, onboarding details, and internship-related communication, please join our official WhatsApp group using the link below:

👉 Join WhatsApp Group: https://chat.whatsapp.com/De9WJRx7Mp8H3Wz5OOGydA

You can expect to hear back from us within the next 2–3 business days regarding the status of your application.

If you have any questions in the meantime, feel free to reach out to us.

Best regards,  
The Athenura Team  
🌐 www.athenura.in`;


    await sendEmail(newIntern.email, "Athenura - Internship Application Received", `<pre style="font-family:inherit;">${emailMsg}</pre>`);

    res.status(201).json({ message: "Intern created successfully", intern: newIntern });

  } catch (error) {
    console.log('Error while creating intern:', error);
    res.status(500).json({ message: "Server Error" });
  }
};


export const getApplicationStatus = async (req, res) => {
  try {
    let setting = await Setting.findOne();

    if (!setting) {
      setting = await Setting.create({ isApplicationOpen: true });
    }

    res.status(200).json({
      success: true,
      isApplicationOpen: setting.isApplicationOpen,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching application status",
      error: error.message,
    });
  }
};



export const verifyIntern = async (req, res) => {
  try {
    const { uniqueId, joiningDate, email } = req.body;

    // 🔹 Validate inputs
    if (!uniqueId || !joiningDate || !email) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // 🔹 Normalize joining date (format: YYYY-MM-DD)
    const inputDate = new Date(joiningDate);
    if (isNaN(inputDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid joining date format",
      });
    }

    const normalizedInputDate = inputDate.toISOString().split("T")[0];

    // 🔹 Find intern by ID and email
    const interns = await Intern.find({
      uniqueId: uniqueId.trim(),
      email: email.trim().toLowerCase(),
    });

    if (!interns.length) {
      return res.status(404).json({
        success: false,
        message: "Intern not found. Please check your unique ID and email.",
      });
    }

    // 🔹 Match by joining date
    const intern = interns.find((i) => {
      const dbDate = new Date(i.joiningDate);
      const normalizedDbDate = dbDate.toISOString().split("T")[0];
      return normalizedDbDate === normalizedInputDate;
    });

    if (!intern) {
      return res.status(404).json({
        success: false,
        message: "No matching record found for the provided joining date.",
      });
    }

    // 🔹 Find performance data
    const performance = await Performance.findOne({ intern: intern._id });

    // 🔹 Prepare full response data
    const responseData = {
      fullName: intern.fullName,
      email: intern.email,
      mobile: intern.mobile,
      dob: intern.dob,
      joiningDate: intern.joiningDate,
      uniqueId: intern.uniqueId,
      college: intern.college,
      status: intern.status,
      course: intern.course,
      educationLevel: intern.educationLevel,
      domain: intern.domain,
      duration: intern.duration,
      totalMeetings: intern.totalMeetings || 0,
      meetingsAttended: intern.meetingsAttended || 0,
      certificateStatus: intern.certificateStatus || "not issued",
      certificateNumber: intern.certificateNumber || null,
      certificateIssuedAt: intern.certificateIssuedAt || null,
      performance: performance || { monthlyPerformance: [] },
    };

    // 🔹 Send response (wrapped in object for frontend)
    return res.status(200).json({
      success: true,
      message: "Intern verified successfully",
      responseData,
    });
  } catch (error) {
    console.error("❌ Error verifying intern:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while verifying intern",
    });
  }
};


export const LeaveApplication = async (req, res) => {
  try {
    const { internId, leaveType, startDate, endDate, reason, totalDays } = req.body;

    if (!internId || !leaveType || !startDate || !endDate || !reason || !totalDays) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const start = new Date(startDate + "T00:00:00");
    const end = new Date(endDate + "T00:00:00");

    if (isNaN(start) || isNaN(end)) {
      return res.status(400).json({ error: "Invalid date format" });
    }
    if (start > end) {
      return res.status(400).json({ error: "End date must be after start date" });
    }

    const intern = await Intern.findOne({ uniqueId: internId });

    if (!intern) {
      return res.status(404).json({ error: "Intern ID not found" });
    }

    const overlapping = await Leave.findOne({
      internId: intern._id,
      $or: [{ startDate: { $lte: end }, endDate: { $gte: start } }],
      status: { $in: ["Pending", "Approved"] }
    });

    if (overlapping) {
      return res.status(400).json({ error: "You already have a leave request in this date range" });
    }

    const leave = await Leave.create({
      uniqueId: internId,
      internId: intern._id,
      leaveType,
      startDate: start,
      endDate: end,
      totalDays,
      reason,
      status: "Pending"
    });

    return res.status(201).json({ message: "Leave application submitted successfully", leave });

  } catch (error) {
    console.error("Leave Application Error:", error);
    return res.status(500).json({ error: "Server error", details: error.message });
  }
};

