import InternIncharge from "../models/InternHead.js"
import Intern from "../models/InternDatabase.js"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { sendEmail } from "../config/emailConfig.js"
import Attendance from "../models/Attendance.js"
import Performance from "../models/Performance.js"  
import Leave from "../models/LeaveDB.js"

export const registerInternIncharge = async (req, res) => {
  try {
    const {
      fullName,
      email,
      password,
      mobile,
      department,
      gender,
      address,
      city,
      state,
      pinCode,
      Secret_Key
    } = req.body;

    // 1️⃣ Check required fields
    if (!fullName || !email || !password || !mobile || !department || !gender) {
      return res.status(400).json({ message: "All required fields must be filled" });
    }

    // 2️⃣ Check if user already exists
    const existingUser = await InternIncharge.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    if (Secret_Key !== process.env.INCHARGE_SECRET_KEY) {
      return res.status(400).json({ message: "Invalid Secret Key Please Contact to Admin" });
    }

    // 3️⃣ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4️⃣ Create new Intern Incharge
    const newIncharge = await InternIncharge.create({
      fullName,
      email,
      password: hashedPassword,
      mobile,
      departments: department,
      gender,
      address,
      city,
      state,
      pinCode,
    });

    res.status(201).json({
      message: "Intern Incharge registered successfully",
      user: {
        id: newIncharge._id,
        fullName: newIncharge.fullName,
        email: newIncharge.email,
        department: newIncharge.department,
      },
    });
  } catch (error) {
    console.error("❌ Error registering Intern Incharge:", error);
    res.status(500).json({ message: "Server error. Please try again." });
  }
};

// 🔐 JWT Generator
export const loginInternIncharge = async (req, res) => {
  try {
    const { email, password } = req.body;
    // ✅ Step 1: Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide both email and password",
      });
    }

    // ✅ Step 2: Find intern incharge
    const internIncharge = await InternIncharge.findOne({ email });
    if (!internIncharge)
      return res.status(401).json({ success: false, message: "Invalid email or password", });


    // ✅ Step 3: Compare password
    const isPasswordValid = await bcrypt.compare(password, internIncharge.password);
    if (!isPasswordValid)
      return res.status(401).json({ message: "Invalid credentials." });

    // ✅ Step 4: Check account status
    if (internIncharge.status !== "Active") {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive. Please contact administrator.",
      });
    }

    // ✅ Step 5: Generate JWT (inline)
    const token = jwt.sign(
      { id: internIncharge._id, role: internIncharge.role || "InternIncharge" },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    // ✅ Step 6: Prepare response data (omit password)
    const userData = {
      _id: internIncharge._id,
      fullName: internIncharge.fullName,
      email: internIncharge.email,
      mobile: internIncharge.mobile,
      department: internIncharge.departments,
      gender: internIncharge.gender,
      role: internIncharge.role || "InternIncharge",
      status: internIncharge.status || "Active",
      createdAt: internIncharge.createdAt,
    };

    // ✅ Step 7: Set secure cookie
    res.cookie("internIncharge_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    // ✅ Step 8: Success response
    res.status(200).json({
      success: true,
      message: "Login successful",
      user: userData,
      token,
    });

  } catch (error) {
    console.error("⚠️ Intern Incharge Login Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login",
      error: error.message,
    });
  }
};


// @desc    Check Intern Incharge Authentication
// @route   GET /api/intern-incharge/check-auth
// @access  Private
export const checkInternInchargeAuth = async (req, res) => {
  try {
    const token = req.cookies.internIncharge_token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token, authorization denied"
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "intern_incharge_secret");

    // Find user
    const internIncharge = await InternIncharge.findById(decoded.id);

    if (!internIncharge) {
      return res.status(401).json({
        success: false,
        message: "Token is not valid"
      });
    }

    // Check if account is active
    if (internIncharge.status !== "Active") {
      return res.status(403).json({
        success: false,
        message: "Account is inactive"
      });
    }

    res.status(200).json({
      success: true,
      user: {
        _id: internIncharge._id,
        fullName: internIncharge.fullName,
        email: internIncharge.email,
        mobile: internIncharge.mobile,
        department: internIncharge.departments,
        gender: internIncharge.gender,
        role: internIncharge.role,
        status: internIncharge.status,
        assignedInterns: internIncharge.assignedInterns
      }
    });

  } catch (error) {
    console.error("Check Auth Error:", error);
    res.status(401).json({
      success: false,
      message: "Token is not valid"
    });
  }
};

export const DomainWiseInterns = async (req, res) => {
  try {
    const incharge = await InternIncharge.findById(req.user._id);

    if (!incharge) {
      return res.status(404).json({ error: "Incharge not found" });
    }

    // Fetch interns that match ANY of the incharge’s departments

    const interns = await Intern.find({ status: ["Active", "Inactive", "Completed"], domain: incharge.departments }).sort({ updatedAt: -1 })

    res.json({ interns });

  } catch (error) {
    console.error("Error fetching assigned interns:", error);
    res.status(500).json({ error: "Server error" });
  }
}




export const logoutInternIncharge = async (req, res) => {
  try {
    res.clearCookie("internIncharge_token");

    res.status(200).json({
      success: true,
      message: "Logout successful"
    });
  } catch (error) {
    console.error("Logout Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during logout"
    });
  }
};


// 🔹 In-memory OTP store
const otpStore = new Map(); // key = email, value = { otp, expiresAt }

// ✅ Step 1: Send OTP
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const incharge = await InternIncharge.findOne({ email });
    if (!incharge) {
      return res.status(404).json({ message: "No incharge found with this email." });
    }

    // Generate OTP and expiry
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 mins

    otpStore.set(email, { otp, expiresAt });
    setTimeout(() => otpStore.delete(email), 5 * 60 * 1000);

    // Send OTP Email
    await sendEmail(
      incharge.email,
      "Password Reset OTP - Intern Incharge",
      `
    <div style="font-family: Arial, sans-serif; padding: 16px; background:#f9fafb;">
      <h2 style="color:#4f46e5;">Graphura Intern System</h2>
      <p>Hello ${incharge.fullName || "Incharge"},</p>
      <p>Your OTP for resetting password is:</p>
      <h1 style="color:#16a34a; letter-spacing:4px;">${otp}</h1>
      <p>This OTP will expire in <b>5 minutes</b>.</p>
      <p>Please do not share this code with anyone.</p>
    </div>
  `
    );

    res.status(200).json({ message: "OTP sent successfully to your email." });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({ message: "Error sending OTP. Please try again later." });
  }
};

// ✅ Step 2: Verify OTP
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const record = otpStore.get(email);

    if (!record) return res.status(400).json({ message: "OTP not found or expired." });
    if (record.expiresAt < Date.now()) {
      otpStore.delete(email);
      return res.status(400).json({ message: "OTP has expired." });
    }
    if (record.otp !== otp) return res.status(400).json({ message: "Invalid OTP." });

    res.status(200).json({ message: "OTP verified successfully." });
  } catch (error) {
    console.error("Verify OTP Error:", error);
    res.status(500).json({ message: "Error verifying OTP." });
  }
};

// ✅ Step 3: Reset Password
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const record = otpStore.get(email);

    if (!record) return res.status(400).json({ message: "OTP not found or expired." });
    if (record.expiresAt < Date.now()) {
      otpStore.delete(email);
      return res.status(400).json({ message: "OTP has expired." });
    }
    if (record.otp !== otp) return res.status(400).json({ message: "Invalid OTP." });

    const incharge = await InternIncharge.findOne({ email });
    if (!incharge) return res.status(404).json({ message: "Incharge not found." });

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(newPassword, salt);
    incharge.password = hashed;
    await incharge.save();

    otpStore.delete(email);
    res.status(200).json({ message: "Password reset successfully!" });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ message: "Error resetting password." });
  }
};

// ✅ Step 4: Resend OTP
export const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const incharge = await InternIncharge.findOne({ email });
    if (!incharge) return res.status(404).json({ message: "Incharge not found." });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000;

    otpStore.set(email, { otp, expiresAt });
    setTimeout(() => otpStore.delete(email), 5 * 60 * 1000);

    await sendEmail(
      email,
      "Resend OTP - Intern Incharge",
      `
    <div style="font-family: Arial, sans-serif; padding: 16px;">
      <p>Your new OTP is:</p>
      <h2 style="color:#4f46e5;">${otp}</h2>
      <p>Valid for 5 minutes.</p>
    </div>
  `
    );
    res.status(200).json({ message: "OTP resent successfully." });
  } catch (error) {
    console.error("Resend OTP Error:", error);
    res.status(500).json({ message: "Error resending OTP." });
  }
};




export const InternComments = async (req, res) => {
  try {
    const { internId } = req.params;
    const { comment } = req.body;

    if (!comment) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a comment'
      });
    }

    // Verify the intern exists and is assigned to this incharge
    const intern = await Intern.findById(internId);
    if (!intern) {
      return res.status(404).json({
        success: false,
        message: 'Intern not found'
      });
    }

    const incharge = await InternIncharge.findById(req.user._id);
    if (!incharge.departments.includes(intern.domain)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to add comments for this intern'
      });
    }

    // Create new comment object
    const newComment = {
      text: comment,
      commentedBy: req.user._id,
      date: new Date()
    };

    // Add comment to intern's comments array
    const updatedIntern = await Intern.findByIdAndUpdate(
      internId,
      {
        $push: { comments: newComment },
        updatedByIncharge: req.user._id
      },
      { new: true }
    ).populate('comments.commentedBy', 'fullName');

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      intern: updatedIntern
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding comment'
    });
  }
}

export const DeleteComments = async (req, res) => {
  try {
    const { internId, commentId } = req.params;

    // Verify the intern exists
    const intern = await Intern.findById(internId);
    if (!intern) {
      return res.status(404).json({
        success: false,
        message: 'Intern not found'
      });
    }

    // Remove comment from intern's comments array
    const updatedIntern = await Intern.findByIdAndUpdate(
      internId,
      {
        $pull: { comments: { _id: commentId } },
        updatedByIncharge: req.user._id
      },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Comment deleted successfully',
      intern: updatedIntern
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting comment'
    });
  }
}




export const markAttendance = async (req, res) => {
  try {
    const { attendanceDate, domain, attendanceRecords, sendEmail: shouldSendEmail } = req.body;

    if (!attendanceDate || !domain || !attendanceRecords || !Array.isArray(attendanceRecords)) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: attendanceDate, domain, and attendanceRecords"
      });
    }

    const updatedInterns = [];
    const emailPromises = [];

    for (const record of attendanceRecords) {
      try {
        // Create attendance record
        const attendance = new Attendance({
          intern: record.internId,
          meetingDate: attendanceDate,
          status: record.status,
          remarks: record.remarks || ""
        });

        await attendance.save();

        // Update intern's attendance stats
        const intern = await Intern.findById(record.internId);
        if (intern) {
          intern.totalMeetings = (intern.totalMeetings || 0) + 1;

          if (record.status === "Present") {
            intern.meetingsAttended = (intern.meetingsAttended || 0) + 1;
          } else if (record.status === "Leave") {
            intern.leavesTaken = (intern.leavesTaken || 0) + 1;
          }

          await intern.save();
          updatedInterns.push(intern);

          // Send email if requested
          if (shouldSendEmail) {
            emailPromises.push(sendAttendanceEmail(intern, record.status, attendanceDate, record.remarks));
          }
        }
      } catch (error) {
        console.error(`Error processing attendance for intern ${record.internId}:`, error);
        // Continue with other records even if one fails
      }
    }

    // Send all emails in parallel
    if (shouldSendEmail && emailPromises.length > 0) {
      try {
        await Promise.all(emailPromises);
      } catch (emailError) {
        console.error("❌ Error sending some emails:", emailError);
        // Don't fail the entire request if emails fail
      }
    }

    res.json({
      success: true,
      message: `Attendance marked successfully for ${attendanceRecords.length} interns${shouldSendEmail ? ' and emails sent' : ''}`,
      updatedInterns
    });

  } catch (error) {
    console.error("❌ Error marking attendance:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark attendance",
      error: error.message
    });
  }
};


const sendAttendanceEmail = async (intern, status, date, remarks) => {
  try {
    const formattedDate = new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const emailMsg = `Dear ${intern.fullName},

Your attendance for ${formattedDate} has been recorded.

📌 Attendance Status: ${status}
${remarks ? `📌 Remarks: ${remarks}\n` : ''}
📌 Domain: ${intern.domain}

${getStatusMessage(status)}

If you have any questions or concerns regarding this attendance record, please contact your domain incharge.

Best regards,
Graphura Team
🌐 www.graphura.online`;

    if (status == "Present") {
      await sendEmail(
        intern.email,
        `Graphura - Attendance Update for ${formattedDate}`,
        `<pre style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.5; white-space: pre-wrap;">${emailMsg}</pre>`
      );
    }
  } catch (error) {
    console.error(`❌ Failed to send attendance email to ${intern.email}:`, error);
    throw error; // Re-throw to handle in Promise.all
  }
};


const getStatusMessage = (status) => {
  switch (status) {
    case 'Present':
      return 'Thank you for your regular attendance. Keep up the good work!';
    case 'Absent':
      return 'Please ensure to inform your incharge in advance if you are unable to attend meetings.';
    case 'Leave':
      return 'Your leave has been recorded. Please ensure to follow the proper leave procedure in future.';
    default:
      return 'Thank you for your participation.';
  }
};


export const meetingDateDetails = async (req, res) => {
  try {
    // Get all unique meeting dates grouped by department
    const meetingDatesByDept = await Attendance.aggregate([
      {
        $lookup: {
          from: "interns",
          localField: "intern",
          foreignField: "_id",
          as: "internData"
        }
      },
      {
        $unwind: "$internData"
      },
      {
        $group: {
          _id: {
            department: "$internData.domain",
            meetingDate: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$meetingDate"
              }
            }
          },
          date: { $first: "$meetingDate" },
          totalInterns: { $sum: 1 },
          presentCount: {
            $sum: {
              $cond: [{ $eq: ["$status", "Present"] }, 1, 0]
            }
          },
          absentCount: {
            $sum: {
              $cond: [{ $eq: ["$status", "Absent"] }, 1, 0]
            }
          },
          leaveCount: {
            $sum: {
              $cond: [{ $eq: ["$status", "Leave"] }, 1, 0]
            }
          }
        }
      },
      {
        $group: {
          _id: "$_id.department",
          meetings: {
            $push: {
              date: "$_id.meetingDate",
              originalDate: "$date",
              totalInterns: "$totalInterns",
              presentCount: "$presentCount",
              absentCount: "$absentCount",
              leaveCount: "$leaveCount",
              attendanceRate: {
                $multiply: [
                  {
                    $divide: ["$presentCount", "$totalInterns"]
                  },
                  100
                ]
              }
            }
          }
        }
      },
      {
        $project: {
          department: "$_id",
          meetings: 1,
          _id: 0
        }
      }
    ]);

    // Convert to object format for easier access
    const result = {};
    meetingDatesByDept.forEach(dept => {
      // Sort meetings by date (newest first)
      dept.meetings.sort((a, b) => new Date(b.originalDate) - new Date(a.originalDate));
      result[dept.department] = dept.meetings;
    });

    res.json({
      success: true,
      departmentMeetings: result
    });

  } catch (error) {
    console.error('Error fetching department meetings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching department meetings data'
    });
  }
}



export const MeetingData = async (req, res) => {
  try {
    const { department, date } = req.query;

    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const attendanceRecords = await Attendance.find({
      meetingDate: {
        $gte: startDate,
        $lte: endDate
      }
    }).populate('intern', 'fullName uniqueId email mobile gender status domain');


    // Filter by department and format data
    const filteredRecords = attendanceRecords
      .filter(record =>
        record.intern &&
        record.intern.domain &&
        (
          record.intern.domain.toLowerCase().includes(department.toLowerCase()) ||
          department.toLowerCase().includes(record.intern.domain.toLowerCase())
        )
      ).map(record => ({
        internName: record.intern.fullName,
        internId: record.intern.uniqueId,
        email: record.intern.email,
        mobile: record.intern.mobile,
        gender: record.intern.gender,
        status: record.intern.status,
        attendanceStatus: record.status,
        remarks: record.remarks,
        meetingDate: record.meetingDate
      }));

    res.json({
      success: true,
      department,
      date,
      attendanceRecords: filteredRecords,
      totalRecords: filteredRecords.length
    });

  } catch (error) {
    console.error('Error fetching meeting details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching meeting details'
    });
  }
}



export const ExtendedDays = async (req, res) => {
  try {
    const { extendedDays } = req.body;
    const internId = req.params.id;

    if (!extendedDays || extendedDays <= 0) {
      return res.status(400).json({
        success: false,
        message: "Extended days must be a positive number"
      });
    }

    const intern = await Intern.findById(internId);

    if (!intern) {
      return res.status(404).json({
        success: false,
        message: "Intern not found"
      });
    }

    if (!intern.joiningDate) {
      return res.status(400).json({
        success: false,
        message: "Intern joining date is required"
      });
    }

    // Calculate new total extended days
    const totalExtendedDays = (intern.extendedDays || 0) + parseInt(extendedDays);

    // Calculate end date from original joining date
    const joinDate = new Date(intern.joiningDate);
    const endDate = new Date(joinDate);

    // Calculate base duration from joining date
    if (intern.duration === "8 Months") endDate.setMonth(joinDate.getMonth() + 8);
    else if (intern.duration === "3 Months") endDate.setMonth(joinDate.getMonth() + 3);
    else if (intern.duration === "4 Months") endDate.setMonth(joinDate.getMonth() + 4);
    else if (intern.duration === "6 Months") endDate.setMonth(joinDate.getMonth() + 6);

    // Add total extended days
    endDate.setDate(endDate.getDate() + totalExtendedDays);

    const now = new Date();

    // Update extended days in database
    intern.extendedDays = totalExtendedDays;

    // If intern was completed but the new extended end date is in future, reactivate
    if (intern.status === "Completed" && now < endDate) {
      intern.status = "Active";
    }
    // If intern is active but the new extended end date is in past, complete them
    else if (intern.status === "Active" && now >= endDate) {
      intern.status = "Completed";
    }

    await intern.save();

    // Send email notification to intern
    const emailSubject = ` Internship Extended - ${intern.fullName}`;
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
          <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .highlight { background: #e7f3ff; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
              .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>Graphura Internship Extended!</h1>
                  <p>Your internship has been extended</p>
              </div>
              <div class="content">
                  <h2>Hello ${intern.fullName},</h2>
                  
                  <p>We're pleased to inform you that your internship at Graphura has been extended.</p>
                  
                  <div class="highlight">
                      <h3>📅 Extension Details:</h3>
                      <p><strong>Additional Days:</strong> ${extendedDays} days</p>
                      <p><strong>Total Extended Days:</strong> ${totalExtendedDays} days</p>
                      <p><strong>New End Date:</strong> ${endDate.toDateString()}</p>
                      <p><strong>Current Status:</strong> ${intern.status}</p>
                  </div>

                  <p>If you have any questions, please don't hesitate to contact your department incharge.</p>

                  <p>Best regards,<br>
                  <strong>Graphura Team</strong></p>
              </div>
              <div class="footer">
                  <p>This is an automated notification. Please do not reply to this email.</p>
              </div>
          </div>
      </body>
      </html>
    `;

    // Send email (fire and forget - don't wait for response)
    sendEmail(intern.email, emailSubject, emailHtml).catch(err => {
      console.error("Failed to send extension email:", err);
      // Don't throw error - email failure shouldn't prevent extension
    });

    const message = intern.status === "Active"
      ? `Internship extended by ${extendedDays} days. New end date: ${endDate.toDateString()}`
      : `Internship extended by ${extendedDays} days. Intern remains completed as end date (${endDate.toDateString()}) has passed`;

    res.json({
      success: true,
      message: message,
      intern: {
        _id: intern._id,
        fullName: intern.fullName,
        extendedDays: intern.extendedDays,
        status: intern.status,
        calculatedEndDate: endDate.toISOString().split('T')[0]
      }
    });

  } catch (error) {
    console.error("Error extending internship:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
}



const calculateDurationInMonths = (duration) => {
  if (!duration) return 3; // Default to 3 months

  const match = duration.toString().match(/(\d+)\s*month/i);
  return match ? parseInt(match[1]) : 3;
};

const calculateOverallPerformance = (monthlyPerformance) => {
  if (!monthlyPerformance || monthlyPerformance.length === 0);

  const validMonths = monthlyPerformance.filter(month => month.overallRating > 0);
  if (validMonths.length === 0) return "Good";
  const avgRating = validMonths.reduce((sum, month) => sum + month.overallRating, 0) / validMonths.length;

  if (avgRating >= 8.5) return "Excellent";
  if (avgRating >= 7) return "Good";
  return "Good"
};



export const getInternPerformance = async (req, res) => {
  try {
    const { internId } = req.params;

    let performance = await Performance.findOne({ intern: internId })
      .populate('intern', 'fullName domain duration');

    if (!performance) {
      // If no performance record exists, create one with initial structure
      const intern = await Intern.findById(internId);
      if (!intern) {
        return res.status(404).json({
          success: false,
          message: 'Intern not found'
        });
      }

      // Calculate duration in months
      const durationMonths = calculateDurationInMonths(intern.duration);
      const monthlyPerformance = [];

      for (let i = 1; i <= durationMonths; i++) {
        monthlyPerformance.push({
          monthLabel: `Month ${i}`,
          totalTasks: 0,
          tasksCompleted: 0,
          ratings: {
            initiative: 0,
            communication: 0,
            behaviour: 0
          },
          overallRating: 0,
          completionPercentage: 0,
          inchargeRemarks: ""
        });
      }

      performance = new Performance({
        intern: internId,
        monthlyPerformance
      });

      await performance.save();
      await performance.populate('intern', 'fullName domain duration status');
    }

    res.json({
      success: true,
      performance
    });

  } catch (error) {
    console.error('Error fetching performance:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching performance data'
    });
  }
};

// Update performance data for an intern
export const updateInternPerformance = async (req, res) => {
  try {
    const { internId } = req.params;
    const { monthlyPerformance } = req.body;

    // Validate input
    if (!monthlyPerformance || !Array.isArray(monthlyPerformance)) {
      return res.status(400).json({
        success: false,
        message: 'Monthly performance data is required and must be an array'
      });
    }

    // Validate each month's data
    for (let month of monthlyPerformance) {
      if (!month.monthLabel) {
        return res.status(400).json({
          success: false,
          message: 'Each month must have a monthLabel'
        });
      }

      // Validate ratings
      if (month.ratings) {
        const { initiative, communication, behaviour } = month.ratings;
        if (initiative < 0 || initiative > 10 ||
          communication < 0 || communication > 10 ||
          behaviour < 0 || behaviour > 10) {
          return res.status(400).json({
            success: false,
            message: 'Ratings must be between 0 and 10'
          });
        }
      }
    }

    let performance = await Performance.findOne({ intern: internId });

    if (!performance) {
      performance = new Performance({
        intern: internId,
        monthlyPerformance: []
      });
    }

    // Update monthly performance
    performance.monthlyPerformance = monthlyPerformance;

    // The pre-save middleware will automatically calculate overallRating and completionPercentage
    await performance.save();

    // Update intern's overall performance (ONLY performance field, not status)
    const overallPerformance = calculateOverallPerformance(monthlyPerformance);
    await Intern.findByIdAndUpdate(internId, {
      performance: overallPerformance
    });

    // Populate the response (status will remain unchanged)
    await performance.populate('intern', 'fullName domain duration status performance');

    res.json({
      success: true,
      message: 'Performance updated successfully',
      performance,
      overallPerformance
    });

  } catch (error) {
    console.error('Error updating performance:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating performance data'
    });
  }
};



export const LeaveRequests = async (req, res) => {
  try {
    const incharge = req.user;
    const today = new Date();

    const leaves = await Leave.find({
      status: { $in: ['Pending', 'Approved'] },
      endDate: { $gte: today }
    })
      .populate('internId', 'fullName uniqueId domain mobile email')
      .sort({ createdAt: -1 });

    const filteredLeaves = leaves.filter(leave =>
      leave?.internId?.domain &&
      Array.isArray(incharge?.departments) &&
      incharge.departments.includes(leave.internId.domain)
    );

    res.json({
      success: true,
      leaves: filteredLeaves
    });
  } catch (error) {
    console.error('Error fetching pending leaves:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending leaves'
    });
  }
}



export const approvedLeaveStatus = async (req, res) => {
  try {
    const { leaveId } = req.params;

    const leave = await Leave.findById(leaveId).populate('internId');
    const intern = await Intern.findById(leave.internId);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    // Update leave status
    leave.status = 'Approved';
    intern.leavesTaken = (intern.leavesTaken || 0) + leave.totalDays;
    await intern.save();
    await leave.save();

    // Send approval email to intern
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
            <p>Your leave has been approved by your Manager. Please ensure a smooth handover of your work before proceeding on leave.</p>
            <p>If you have any questions, please contact your Intern Incharge.</p>
          </div>
          <div class="footer">
            <p>This is an automated notification from Graphura Internship Program.</p>
            <p>© ${new Date().getFullYear()} Graphura India Private Limited. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email to intern
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



export const rejectLeaveStatus = async (req, res) => {
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

    // Send rejection email to intern
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
          .contact-info { background: #e9ecef; padding: 15px; border-radius: 5px; margin: 15px 0; }
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
            <div class="contact-info">
              <p><strong>Note:</strong> Your leave request has been rejected. Please contact your Manager for more details or clarification regarding this decision.</p>
            </div>
            <p>If you believe this is an error or have additional information to share, please reach out to your Intern Incharge directly.</p>
          </div>
          <div class="footer">
            <p>This is an automated notification from Graphura Internship Program.</p>
            <p>© ${new Date().getFullYear()} Graphura India Private Limited . All rights reserved.</p>
          </div>
        </div>
      </body> 
      </html>
    `;

    // Send email to intern
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