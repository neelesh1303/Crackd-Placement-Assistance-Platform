//ye file Tracker model ko define karta hai, jo ki users ke study plans aur progress ko track karne ke liye use hota hai. isme user reference, target company aur role details, source of plan generation (AI ya fallback), weekly study plan, aur checklist items store kiye jate hain. ye model users ko unke placement preparation ke progress ko manage karne me help karta hai, aur unhe structured way me apne goals achieve karne me support karta hai.

const mongoose = require("mongoose");

const trackerSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    target: {
      companySlug: { type: String, default: "", trim: true },
      role: { type: String, required: true, trim: true },
      weeks: { type: Number, required: true },
      hoursPerDay: { type: Number, required: true },
    },
    source: { type: String, enum: ["ai", "huggingface", "gemini", "fallback"], default: "fallback" },
    weeklyPlan: [
      {
        week: { type: Number, required: true },
        focus: [{ type: String, trim: true }],
        tasks: [{ type: String, trim: true }],
      },
    ],
    checklist: [
      {
        topic: { type: String, required: true, trim: true },
        state: { type: String, enum: ["todo", "in-progress", "done"], default: "todo" },
        completedAt: { type: Date, default: null }, // kab complete hua
      },
    ],
    // Streak system ke liye fields
    streak: {
      current: { type: Number, default: 0 }, // abhi ka active streak
      longest: { type: Number, default: 0 }, // sabse lambi streak
      lastActivityDate: { type: Date, default: null }, // akhri activity
    },
    // Readiness calculation ke liye
    readiness: {
      percentage: { type: Number, default: 0, min: 0, max: 100 }, // 0-100%
      lastCalculated: { type: Date, default: null },
      completedTopics: { type: Number, default: 0 },
      totalTopics: { type: Number, default: 0 },
    },
    // Day-wise activity tracking
    dailyActivity: [
      {
        date: { type: Date, required: true },
        tasksCompleted: { type: Number, default: 0 },
        topicsProgressed: { type: Number, default: 0 },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Tracker", trackerSchema);