const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
    },
    branch: {
      type: String,
      required: [true, "Branch is required"],
      trim: true,
    },
    year: {
      type: Number,
      required: [true, "Year is required"],
      min: 1,
      max: 4,
    },
    isSenior: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    targetCompanies: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Company",
      },
    ],
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function () { //this is a middleware which is called before saving the user to the database. password pehle encrypt hota hai before saving the user. isModified method se check karte hain ki password field me koi change hua hai ya nahi. agar password me change nahi hua hai to hashing process ko skip kar dete hain. agar password me change hua hai to usse hash kar ke save karte hain.
  if (!this.isModified("password")) return;  //if password field is not modified, return and skip hashing
  this.password = await bcrypt.hash(this.password, 10); //10 is the salt rounds, which determines the complexity of the hashing. higher the number, more secure but also more time consuming. 10 is a good balance for most applications.
});

// Method to compare passwords during login
userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);