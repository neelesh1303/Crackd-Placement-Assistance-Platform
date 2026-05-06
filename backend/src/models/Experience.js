const mongoose = require("mongoose");

const roundSchema = new mongoose.Schema( //roundSchema is a subdocument schema, which represents the details of each round in the interview process. isse experienceSchema me rounds field ke andar use kiya gaya hai, jisme multiple rounds ke details store kiye ja sakte hain. har round me round number, type, description, problems asked, topics covered, aur duration jaisi information store ki jati hai.
  {
    roundNo: { type: Number, required: true },
    type: {
      type: String,
      enum: ["OA", "DSA", "LLD", "HR", "Technical", "Managerial"],
      required: true,
    },
    description: { type: String, default: "" },
    problemsAsked: [{ type: String, trim: true }],
    topics: [{ type: String, trim: true }],
    duration: { type: String, default: "" },
  },
  { _id: false } //_id: false option se ye ensure hota hai ki roundSchema ke subdocuments me automatically _id field generate na ho, kyunki har round ke details ke liye unique _id ki zarurat nahi hoti. isse database me unnecessary _id fields create hone se bachaya jata hai, aur storage space bhi save hota hai.
);

const experienceSchema = new mongoose.Schema( //experienceSchema is the main schema which represents the placement experience shared by users. isme company reference, role, year, ctc, cgpa cutoff, postedBy user reference, isSenior flag, rounds details, tips, resources, gotOffer flag, prepTime aur upvotes fields store kiye jate hain. ye schema users ke dwara share kiye gaye placement experiences ko structure karta hai aur database me store karta hai.
  {
    company: {
      type: mongoose.Schema.Types.ObjectId, //company field me company ke ObjectId reference ko store kiya jata hai jisse fir se compkany details na store karni pade, aur jab experience data retrieve karte hain to populate karke company ke details fetch kar sakte hain. isse data normalization hoti hai, aur database me redundancy kam hoti hai.
      ref: "Company", //company field me Company model ka reference store kiya jata hai, jisse hum easily populate karke company ke details fetch kar sakte hain jab experience data retrieve karte hain. isse hume company ke name, logo, roles, visit month, aur difficulty level jaise information mil sakti hai experience ke sath.
      required: true,
    },
    role: { type: String, required: true, trim: true }, //trim: true option se role field me extra spaces automatically remove ho jate hain, taki data clean aur consistent rahe.
    year: { type: Number, required: true },
    ctc: { type: String, default: "", trim: true },
    cgpaCutoff: { type: Number, default: null },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId, //postedBy field me user ke ObjectId reference ko store kiya jata hai jisse fir se user details na store karni pade, aur jab experience data retrieve karte hain to populate karke user ke details fetch kar sakte hain. isse data normalization hoti hai, aur database me redundancy kam hoti hai. isse hume experience ke sath user ke name, email, branch, year, aur isSenior status jaise information mil sakti hai.
      ref: "User",
      required: true,
    },
    isSenior: { type: Boolean, default: false }, //default value false set kiya gaya hai, taki agar user ne is field ko specify nahi kiya to wo automatically false ho jaye.
    rounds: [roundSchema], 
    tips: { type: String, default: "" },
    resources: [{ type: String, trim: true }],
    gotOffer: { type: Boolean, default: false },
    prepTime: { type: String, default: "" },
    upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true } //timestamps: true option se createdAt aur updatedAt fields automatically add ho jate hain, jisse hume manually date fields manage karne ki zarurat nahi hoti. isse hume pata chal sakta hai ki experience kab create hua tha aur kab last update hua tha, jo ki useful information hoti hai data management ke liye.
);

module.exports = mongoose.model("Experience", experienceSchema);