const mongoose = require("mongoose");

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Company name is required"],
      unique: true,
      trim: true,
    },
    slug: { //slug is a URL-friendly version of the company name, which can be used in URLs instead of the company ID. is unique and required, so that we can easily fetch company data using the slug in the URL. for example, if company name is "Google", slug can be "google". then we can access company data at /companies/google instead of /companies/1234567890.
      type: String,
      required: [true, "Company slug is required"],
      unique: true,
      trim: true,
      lowercase: true,
    },
    logo: { //logo is the URL of the company's logo image, which can be displayed on the frontend. it is optional, so that companies without a logo can still be created.
      type: String,
      default: "",
    },
    roles: [ //roles is an array of strings, which represents the different roles or positions that the company offers for placements.
      {
        type: String,
        trim: true,
      },
    ],
    visitMonth: {
      type: String,
      default: "",
      trim: true,
    },
    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      default: "Medium",
    },
  },
  { timestamps: true } //timestamps option automatically adds createdAt and updatedAt fields to the schema, which store the date and time when a document is created and last updated. this is useful for tracking when companies were added or modified in the database.
);

module.exports = mongoose.model("Company", companySchema);