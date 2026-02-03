import Intern from "../models/InternDatabase.js";

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
    const allowedStatuses = ["Applied", "Selected", "Rejected"]; // Added Rejected

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
        {TpoName: regex},
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

      if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(search)) {
    const [d, m, y] = search.split("/").map(Number);

    searchQuery.createdAt = {
      $gte: new Date(y, m - 1, d, 0, 0, 0),
      $lte: new Date(y, m - 1, d, 23, 59, 59)
    };
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
