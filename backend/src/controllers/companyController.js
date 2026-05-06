const Company = require("../models/Company");

exports.getCompanies = async (req, res) => {
  try {
    const companies = await Company.find().sort({ name: 1 }); //finds all companies in the database and sorts them in ascending order based on the name field. this ensures that the companies are returned in alphabetical order, which can be helpful for displaying them on the frontend in a user-friendly way.
    res.status(200).json({
      success: true,
      count: companies.length,
      companies,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
    exports.getCompanyBySlug = async (req, res) => {
    try {
    const slug = (req.params.slug || "").toLowerCase(); //req.params.slug mein URL ki slug ki value hoti hai
    const company = await Company.findOne({ slug });

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    res.status(200).json({
      success: true,
      company,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};