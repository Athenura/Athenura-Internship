import Intern from "../models/InternDatabase.js";
import { sendEmail } from "../config/emailConfig.js";

// ✅ Fetch all interns (with search, filter, pagination)
export const getAllInterns = async (req, res) => {
  try {
    const {
      search = "",
      status,
      performance,
      domain, // Add domain parameter
    } = req.query;

    // ✅ Allowed status values
    const allowedStatuses = ["Applied", "Selected", "Rejected", "Mailed"]; // Added Rejected

    // 🧩 Build query efficiently
    const searchQuery = {
      status:
        status && allowedStatuses.includes(status)
          ? status
          : { $in: allowedStatuses },
    };

    // 🔍 Add search filter (only if not empty)
    if (search.trim()) {
      const regex = new RegExp(search, "i"); // faster and cleaner regex
      searchQuery.$or = [
        { fullName: regex },
        { email: regex },
        { domain: regex },
        { college: regex },
        { course: regex },
        { educationLevel: regex },
        { uniqueId: regex },
        { mobile: regex },
        { TpoName: regex },
      ];
    }


    // 🎯 Add performance filter if provided
    if (performance) {
      searchQuery.performance = performance;
    }

    // 🎯 Add domain filter if provided
    if (domain) {
      searchQuery.domain = domain;
    }


    // ⚡ Fetch data efficiently
    const interns = await Intern.find(searchQuery)
      .sort({ createdAt: -1 });

    // ✅ Count total documents (faster than interns.length for large results)
    const total = await Intern.countDocuments(searchQuery);

    // 🚀 Respond with data
    res.status(200).json({
      success: true,
      total,
      interns,
    });
  } catch (error) {
    console.error("❌ Error fetching interns:", error);
    res.status(500).json({ message: "Server error. Try again later." });
  }
};

export const getInternById = async (req, res) => {
  try {
    const intern = await Intern.findById(req.params.id);
    if (!intern) return res.status(404).json({ message: "Intern not found" });
    res.status(200).json(intern);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const intern = await Intern.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!intern) return res.status(404).json({ message: "Intern not found" });

    res.status(200).json({ message: "Status updated successfully", intern });
  } catch (err) {
    console.error("Error updating status:", err);
    res.status(500).json({ message: "Failed to update status" });
  }
};

// Update intern performance
export const updatePerformance = async (req, res) => {
  try {
    const { id } = req.params;
    const { performance } = req.body;
    const hrId = req.user.id; // assuming your auth middleware sets req.user

    const intern = await Intern.findByIdAndUpdate(
      id,
      {
        performance,
        updatedByHR: hrId, // track which HR updated performance
      },
      { new: true }
    ).populate("updatedByHR", "fullName email role"); // optional: show HR info

    if (!intern) {
      return res.status(404).json({ message: "Intern not found" });
    }

    res.status(200).json({
      message: "Performance updated successfully",
      intern,
    });
  } catch (err) {
    console.error("Error updating performance:", err);
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
    console.error("Error updating domain:", err);
    res.status(500).json({ message: "Failed to update domain" });
  }
};

export const addHrComment = async (req, res) => {
  try {
    const { id } = req.params; // intern id
    const { text, stage } = req.body;
    const hrId = req.user?.id; // HR id from JWT (if using auth middleware)

    // Validate input
    if (!text || !stage) {
      return res
        .status(400)
        .json({ message: "Stage and comment text are required" });
    }

    // Find intern and push new HR comment
    const intern = await Intern.findByIdAndUpdate(
      id,
      {
        $push: {
          hrComments: {
            text,
            stage,
            commentedBy: hrId,
            date: new Date(),
          },
        },
        updatedByHR: hrId,
      },
      { new: true }
    )
      .populate("hrComments.commentedBy", "fullName email role")
      .populate("updatedByHR", "fullName email role");

    if (!intern) {
      return res.status(404).json({ message: "Intern not found" });
    }

    res.status(200).json({
      message: "HR comment added successfully",
      intern,
    });
  } catch (err) {
    console.error("Error adding HR comment:", err);
    res.status(500).json({ message: "Failed to add HR comment" });
  }
};

export const getHrComments = async (req, res) => {
  try {
    const { id } = req.params; // Intern ID

    // Find intern and populate HR comment authors
    const intern = await Intern.findById(id).populate(
      "hrComments.commentedBy",
      "fullName email role"
    );

    if (!intern) {
      return res.status(404).json({ message: "Intern not found" });
    }

    res.status(200).json({
      message: "HR comments fetched successfully",
      hrComments: intern.hrComments || [],
    });
  } catch (err) {
    console.error("Error fetching HR comments:", err);
    res.status(500).json({ message: "Failed to fetch HR comments" });
  }
};

export const deleteHrComment = async (req, res) => {
  try {
    const { id, commentId } = req.params;
    const hrId = req.user?.id; // Assuming JWT middleware provides logged-in HR ID

    // Find intern
    const intern = await Intern.findById(id);
    if (!intern) {
      return res.status(404).json({ message: "Intern not found" });
    }

    // Find the comment by its ID
    const comment = intern.hrComments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: "HR comment not found" });
    }

    // Optional: Ensure only the HR who added it can delete
    if (comment.commentedBy.toString() !== hrId) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this comment" });
    }

    // Remove the comment
    comment.deleteOne();

    await intern.save();

    res.status(200).json({ message: "HR comment deleted successfully" });
  } catch (err) {
    console.error("Error deleting HR comment:", err);
    res.status(500).json({ message: "Failed to delete HR comment" });
  }
};

export const deleteRejectMany = async (req, res) => {
  try {
    const result = await Intern.deleteMany({ status: "Rejected" });

    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} rejected interns`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Error deleting rejected interns:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete rejected interns",
    });
  }
}

export const ImportedIntern = async (req, res) => {
  try {
    const { interns } = req.body;

    if (!interns || !Array.isArray(interns) || interns.length === 0) {
      return res.status(400).json({
        message: "Invalid or empty data. Please provide an array of interns.",
      });
    }

    if (interns.length > 1000) {
      return res.status(400).json({
        message: "Too many records. Maximum 1000 records per import.",
      });
    }

    const results = {
      total: interns.length,
      success: 0,
      failed: 0,
      duplicates: 0,
      errors: [],
    };

    // ✅ Collect all emails and mobiles at once
    const allEmails = interns.map(i => i.email?.toString().trim().toLowerCase()).filter(Boolean);
    const allMobiles = interns.map(i => i.mobile?.toString().trim()).filter(Boolean);

    // ✅ Query DB once to find existing ones
    const existingInterns = await Intern.find({
      $or: [{ email: { $in: allEmails } }, { mobile: { $in: allMobiles } }]
    }).select("email mobile");

    const existingEmails = new Set(existingInterns.map(e => e.email));
    const existingMobiles = new Set(existingInterns.map(e => e.mobile));

    const seenEmails = new Set();
    const seenMobiles = new Set();
    const validDocs = [];

    const allowedDomains = [
      'Sales & Marketing',
      'Data Science & Analytics',
      'Email and Outreaching',
      'Content writing',
      'Human Resources',
      'Social Media Management',
      'Graphic Design',
      'Digital Marketing',
      'Video Editing',
      "Full Stack Development",
      "MERN Stack Development",
      'Content Creator',
      'UI/UX Designing',
      'Front-end Developer',
      'Back-end Developer'
    ];

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // ✅ Validate all records locally (no DB call)
    for (const [index, internData] of interns.entries()) {
      try {
        const requiredFields = ['fullName', 'email', 'mobile', 'domain'];
        const missing = requiredFields.filter(f => !internData[f] || internData[f].toString().trim() === '');
        if (missing.length) throw new Error(`Missing required fields: ${missing.join(', ')}`);

        const email = internData.email.toString().trim().toLowerCase();
        const mobile = internData.mobile.toString().trim();

        if (!emailRegex.test(email)) throw new Error(`Invalid email format: ${email}`);
        if (mobile.length < 10) throw new Error(`Invalid mobile number: ${mobile}`);

        // Batch duplicate check
        if (seenEmails.has(email) || seenMobiles.has(mobile)) {
          results.duplicates++;
          throw new Error(`Duplicate entry in batch: ${email} / ${mobile}`);
        }

        // Database duplicate check
        if (existingEmails.has(email) || existingMobiles.has(mobile)) {
          results.duplicates++;
          throw new Error(`Already exists in database: ${email} / ${mobile}`);
        }

        if (!allowedDomains.includes(internData.domain)) {
          throw new Error(`Invalid domain: ${internData.domain}`);
        }

        // Prepare intern object
        const internToSave = {
          fullName: internData.fullName.trim(),
          email,
          mobile,
          dob: internData.dob?.toString().trim() || '',
          gender: internData.gender?.toString().trim() || '',
          state: internData.state?.toString().trim() || '',
          city: internData.city?.toString().trim() || '',
          address: internData.address?.toString().trim() || '',
          pinCode: internData.pinCode?.toString().trim() || '',
          college: internData.college?.toString().trim() || '',
          course: internData.course?.toString().trim() || '',
          educationLevel: internData.educationLevel?.toString().trim() || '',
          domain: internData.domain.trim(),
          contactMethod: internData.contactMethod?.toString().trim() || 'Email',
          resumeUrl: internData.resumeUrl?.toString().trim() || '',
          duration: internData.duration?.toString().trim() || '',
          prevInternship: ['Yes', 'No'].includes(internData.prevInternship) ? internData.prevInternship : 'No',
          TpoName: internData.TpoName?.toString().trim() || '',
          TpoEmail: internData.TpoEmail?.toString().trim().toLowerCase() || '',
          TpoNumber: internData.TpoNumber?.toString().trim() || '',
          uniqueId: internData.uniqueId?.toString().trim() || '',
          joiningDate: internData.joiningDate?.toString().trim() || '',
          status:
            internData.uniqueId && internData.joiningDate ? 'Active' : 'Applied',
          performance:
            internData.uniqueId && internData.joiningDate ? 'Good' : 'Average',
          importedBy: req.user._id,
          importDate: new Date(),
          source: "import",
        };

        validDocs.push(internToSave);
        seenEmails.add(email);
        seenMobiles.add(mobile);
        results.success++;

      } catch (err) {
        results.failed++;
        results.errors.push(`Record ${index + 1}: ${err.message}`);
      }
    }

    // ✅ Bulk insert (1 DB call only)
    if (validDocs.length > 0) {
      await Intern.insertMany(validDocs, { ordered: false });
    }

    res.json({
      message: `Import completed: ${results.success} successful, ${results.failed} failed, ${results.duplicates} duplicates.`,
      summary: results,
      importedCount: results.success,
    });
  } catch (error) {
    console.error("Import error:", error);
    res.status(500).json({
      message: "Failed to import interns: " + error.message,
    });
  }
};






function formatTimeToAMPM(time) {
  if (!time) return "";

  const [hours, minutes] = time.split(":");
  let h = parseInt(hours);
  const ampm = h >= 12 ? "PM" : "AM";

  h = h % 12;
  h = h ? h : 12;

  return `${h}:${minutes} ${ampm}`;
}

export const sendInterviewEmail = async (req, res) => {
  try {
    const {
      to,
      toName,
      subject,
      meetingLink,
      meetingDate,
      meetingTime,
      meetingPlatform,
      customMessage,
      hrName,
      hrEmail,
      domain
    } = req.body;

    if (!to || !meetingLink || !meetingDate || !meetingTime) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const formattedDate = new Date(meetingDate).toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const formattedTime = formatTimeToAMPM(meetingTime);

    // Convert domain to array if not already
    const domains = Array.isArray(domain) ? domain : [domain];

    // Create HTML for domain list
    let domainSections = "";

    domains.forEach((d) => {
      domainSections += `
        <tr>
          <td style="padding:10px;border:1px solid #ddd">${d}</td>
          <td style="padding:10px;border:1px solid #ddd">${formattedDate}</td>
          <td style="padding:10px;border:1px solid #ddd">${formattedTime}</td>
          <td style="padding:10px;border:1px solid #ddd">
            <a href="${meetingLink}">Join Meeting</a>
          </td>
        </tr>
      `;
    });

    // Candidate Email
    const htmlContent = `
<div style="background:#f3f4f6;padding:40px 10px;font-family:Segoe UI,Tahoma,sans-serif;color:#374151;">
  
  <div style="max-width:640px;margin:auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 10px 25px rgba(0,0,0,0.08);">

    <!-- Header -->
    <div style="background:#4f46e5;padding:35px;text-align:center;">
      <h1 style="margin:0;color:#ffffff;font-size:26px;">Interview Invitation</h1>
      <p style="margin-top:8px;color:#e0e7ff;font-size:15px;">
        Athenura Internship Program
      </p>
    </div>

    <!-- Body -->
    <div style="padding:35px 30px;">

      <p style="font-size:16px;">Dear <strong>${toName}</strong>,</p>

      <p style="font-size:15px;line-height:1.6;color:#4b5563;">
        Greetings from <strong>Athenura</strong>!  
        We are delighted to inform you that you have been 
        <strong>shortlisted for the interview round</strong> of the 
        Athenura Internship Program.
      </p>

      <p style="font-size:15px;line-height:1.6;color:#4b5563;">
        Based on your application, we believe your profile aligns well with our team and learning culture.
      </p>

      <!-- Interview Details -->
      <div style="margin:30px 0;border:1px solid #e5e7eb;border-radius:10px;padding:22px;background:#fafafa;">
        <h3 style="margin-top:0;color:#111827;font-size:18px;">Interview Details</h3>

        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr>
            <td style="padding:6px 0;color:#6b7280;">Domain</td>
            <td style="padding:6px 0;font-weight:600;color:#111827;">${domain}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#6b7280;">Date</td>
            <td style="padding:6px 0;font-weight:600;color:#111827;">${formattedDate}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#6b7280;">Time</td>
            <td style="padding:6px 0;font-weight:600;color:#111827;">${formattedTime}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#6b7280;">Duration</td>
            <td style="padding:6px 0;font-weight:600;color:#111827;">1 Hour</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#6b7280;">Platform</td>
            <td style="padding:6px 0;font-weight:600;color:#111827;">${meetingPlatform}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#6b7280;">Meeting Link</td>
            <td style="padding:6px 0;font-weight:600;color:#111827;">${meetingLink}</td>
          </tr>
        </table>
      </div>

      <!-- Interview Overview -->
      <div style="margin:25px 0;">
        <h3 style="font-size:18px;margin-bottom:10px;color:#111827;">Interview Overview</h3>

        <ul style="padding-left:18px;color:#4b5563;font-size:14px;line-height:1.7;">
          <li>Discussion about your background, interests, and communication skills</li>
          <li>Understanding your knowledge related to the selected role</li>
          <li>Exploring your learning mindset and career goals</li>
          <li>Explaining expectations and growth opportunities at Athenura</li>
        </ul>
      </div>

      <!-- Portfolio Section -->
      <div style="background:#f9fafb;border-radius:8px;padding:18px;margin:25px 0;">
        <p style="margin:0;font-size:14px;color:#374151;">
          You may share any relevant work during the interview such as:
        </p>

        <ul style="margin-top:10px;padding-left:18px;font-size:14px;color:#4b5563;">
          <li>Projects, portfolios, or GitHub work (for technical roles)</li>
          <li>Content, marketing campaigns, research, or presentations (for non-technical roles)</li>
        </ul>
      </div>

      <!-- Join Button -->
      <div style="text-align:center;margin:35px 0;">
        <a href="${meetingLink}" 
        style="background:#4f46e5;color:#ffffff;padding:14px 32px;
        text-decoration:none;border-radius:8px;font-weight:600;
        font-size:15px;display:inline-block;">
        Join Interview
        </a>
      </div>

      ${customMessage
        ? `<div style="border-left:4px solid #4f46e5;padding-left:14px;margin:25px 0;color:#4b5563;font-style:italic;">
              "${customMessage}"
            </div>`
        : ""
      }

      <p style="font-size:13px;color:#9ca3af;text-align:center;">
        Please join the meeting from a quiet location with a stable internet connection.
      </p>

    </div>

    <!-- Footer -->
    <div style="background:#f9fafb;padding:28px;text-align:center;border-top:1px solid #e5e7eb;">
      <p style="margin:0;font-weight:600;color:#111827;">${hrName}</p>
      <p style="margin:5px 0;font-size:14px;color:#6b7280;">
        HR Team • Athenura
      </p>

      <p style="margin:5px 0;font-size:13px;color:#4f46e5;">
        ${hrEmail}
      </p>

      <p style="margin-top:15px;font-size:12px;color:#9ca3af;">
        © ${new Date().getFullYear()} Athenura. All rights reserved.
      </p>
    </div>

  </div>
</div>
`;

    await sendEmail(to, subject, htmlContent);

    // =============================
    // SINGLE ADMIN EMAIL
    // =============================

    const adminHtml = `
<div style="font-family:Arial;padding:20px">

<h2>📢 Interview Schedule Notification</h2>

<table style="border-collapse:collapse;width:100%;margin-top:20px">

<tr style="background:#f3f4f6">
<th style="padding:10px;border:1px solid #ddd">Domain</th>
<th style="padding:10px;border:1px solid #ddd">Date</th>
<th style="padding:10px;border:1px solid #ddd">Time</th>
<th style="padding:10px;border:1px solid #ddd">Meeting Link</th>
</tr>

${domainSections}

</table>

<p style="margin-top:20px;color:gray">
Automated mail from Athenura Internship System
</p>

</div>
`;

    await sendEmail(
      "mrsameersingh001@gmail.com",
      "Athenura Interview Schedule",
      adminHtml
    );

    res.json({
      success: true,
      message: "Interview email sent successfully",
    });

  } catch (error) {
    console.error("Interview email error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send interview email",
    });
  }
};


