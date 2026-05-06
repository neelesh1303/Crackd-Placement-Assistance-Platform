const mongoose = require("mongoose");

const problemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Problem title is required"],
      trim: true,
    },
    platform: {
      type: String,
      enum: ["LeetCode", "Codeforces", "GeeksforGeeks", "HackerRank", "Other"],
      default: "LeetCode",
    },
    link: {
      type: String,
      default: "",
      trim: true,
    },
    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      required: true,
    },
    topic: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      default: "",
      trim: true,
    },
    askedInRound: {
      type: String,
      enum: ["OA", "DSA", "LLD", "HR", "Technical", "Managerial", "Other"],
      default: "DSA",
    },
    company: {
      type: mongoose.Schema.Types.ObjectId, //company field me company ke ObjectId reference ko store kiya jata hai jisse fir se company details na store karni pade, aur jab problem data retrieve karte hain to populate karke company ke details fetch kar sakte hain. isse data normalization hoti hai, aur database me redundancy kam hoti hai. isse hume problem ke sath company ke name, logo, roles, visit month, aur difficulty level jaise information mil sakti hai.
      ref: "Company",
      required: true,
    },
    year: {
      type: Number,
      default: null,
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Problem", problemSchema);