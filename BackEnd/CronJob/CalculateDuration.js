import cron from "node-cron";
import Intern from "../models/InternDatabase.js";

// Function to check and update interns
export const updateInternStatus = async () => {
  try {
    const now = new Date();
    const interns = await Intern.find({ status: { $in: ["Active", "Completed"] } });

    for (const intern of interns) {
      if (!intern.joiningDate) continue;

      const joinDate = new Date(intern.joiningDate);

      // Validate join date
      if (isNaN(joinDate.getTime())) {
        console.warn(`⚠️ Invalid joining date for intern ${intern._id}: ${intern.joiningDate}`);
        continue;
      }

      let endDate = new Date(joinDate);

      // Normalize duration string for case-insensitive comparison
      const duration = intern.duration?.toLowerCase().trim();

      // Calculate base duration from joining date
      if (duration === "1 month" || duration === "1 Month") {
        endDate.setMonth(joinDate.getMonth() + 1);
      } else if (duration === "2 months" || duration === "2 Months") {
        endDate.setMonth(joinDate.getMonth() + 2);
      } else if (duration === "3 months" || duration === "3 Months") {
        endDate.setMonth(joinDate.getMonth() + 3);
      } else if (duration === "4 months" || duration === "4 Months") {
        endDate.setMonth(joinDate.getMonth() + 4);
      } else if (duration === "5 months" || duration === "5 Months") {
        endDate.setMonth(joinDate.getMonth() + 5);
      } else if (duration === "6 months" || duration === "6 Months") {
        endDate.setMonth(joinDate.getMonth() + 6);
      } else if (duration === "7 months" || duration === "7 Months") {
        endDate.setMonth(joinDate.getMonth() + 7);
      } else if (duration === "8 months" || duration === "8 Months") {
        endDate.setMonth(joinDate.getMonth() + 8);
      } else if (duration === "9 months" || duration === "9 Months") {
        endDate.setMonth(joinDate.getMonth() + 9);
      } else {
        console.warn(`⚠️ Unknown duration for intern ${intern._id}: ${intern.duration}`);
        continue;
      }

      // Handle month overflow (when adding months crosses year boundary)
      if (endDate.getDate() !== joinDate.getDate()) {
        endDate.setDate(0); // Set to last day of previous month
      }

      // Add extended days if any (from the original end date)
      if (intern.extendedDays && intern.extendedDays > 0) {
        endDate.setDate(endDate.getDate() + intern.extendedDays);
      }

      // Validate end date
      if (isNaN(endDate.getTime())) {
        console.error(`❌ Invalid end date calculation for intern ${intern._id}`);
        continue;
      }

      // If intern has extended days and was previously completed, but extended end date is in future
      if (intern.extendedDays > 0 && intern.status === "Completed" && now < endDate) {
        intern.status = "Active";
        await intern.save();
      }
      // Mark as completed if current date is past the calculated end date
      else if (now >= endDate && intern.status === "Active") {
        intern.status = "Completed";
        await intern.save();
      }
    }
  } catch (err) {
    console.error("❌ Error in updating intern status:", err);
  }
};

export const startInternshipCronJob = async () => {
  cron.schedule("0 0 * * *", async () => {
    console.log("🕒 Running internship status update cron job...");
    await updateInternStatus();
  });
};
