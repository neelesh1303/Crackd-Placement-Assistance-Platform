const Company = require("../models/Company");
const { redisClient } = require("../config/redis");

// ============================================================
// GET ALL COMPANIES
// ============================================================
// Flow:
// 1. Pehle Redis mein check karenge ki companies already cached hain ya nahi.
// 2. Agar Redis mein mil gayi → directly Redis se response.
// 3. Agar nahi mili → MongoDB se companies fetch karenge.
// 4. MongoDB se mili companies ko Redis mein 10 minutes ke liye store karenge.
// 5. Frontend ko response bhej denge.
//
// Isse baar-baar MongoDB query karne ki zarurat nahi padegi.
// ============================================================

exports.getCompanies = async (req, res) => {
  try {
    // Redis mein "companies" naam ki key check kar rahe hain.
    // Agar data milta hai to Redis string return karega.
    // Agar data nahi hai to null return hoga.
    const cachedCompanies = await redisClient.get("companies");

    // -------------------- CACHE HIT --------------------
    // Agar Redis mein companies mil gayi,
    // to MongoDB ko query karne ki zarurat nahi hai.
    if (cachedCompanies) {
      console.log("Redis HIT - Companies fetched from Redis");

      // Redis data ko string ke form mein store karta hai,
      // isliye JSON.parse() se usko wapas JavaScript array mein convert kar rahe hain.
      const companies = JSON.parse(cachedCompanies);

      return res.status(200).json({
        success: true,
        count: companies.length,
        companies,
      });
    }

    // -------------------- CACHE MISS --------------------
    // Redis mein companies nahi mili,
    // isliye ab MongoDB se data fetch karenge.
    console.log("Redis MISS - Fetching companies from MongoDB");

    // MongoDB se saari companies fetch kar rahe hain
    // aur name ke according ascending/alphabetical order mein sort kar rahe hain.
    const companies = await Company.find().sort({ name: 1 });

    // MongoDB se mili companies ko Redis mein store kar rahe hain.
    //
    // "companies"  → Redis key
    // 600          → TTL (Time To Live) = 600 seconds = 10 minutes
    // JSON.stringify() → companies array ko string mein convert karta hai,
    //                    kyunki Redis value ko string ke form mein store karega.
    await redisClient.setEx(
      "companies",
      600,
      JSON.stringify(companies)
    );

    // MongoDB se mili companies frontend ko return kar rahe hain.
    return res.status(200).json({
      success: true,
      count: companies.length,
      companies,
    });

  } catch (error) {
    // Agar Redis ya MongoDB mein koi error aaye,
    // to 500 Internal Server Error return karenge.
    res.status(500).json({
      message: error.message,
    });
  }
};


// ============================================================
// GET COMPANY BY SLUG
// ============================================================
// Is function mein ABHI Redis nahi lagaya hai.
// Ye exactly MongoDB se company fetch karega.
//
// Humne Redis sirf getCompanies() mein implement kiya hai.
// ============================================================

exports.getCompanyBySlug = async (req, res) => {
  try {

    // URL se slug nikal rahe hain.
    // Example:
    // /companies/google
    // req.params.slug = "google"
    //
    // toLowerCase() ensure karta hai ki slug lowercase mein ho.
    const slug = (req.params.slug || "").toLowerCase();

    // Slug ke basis par MongoDB se company find kar rahe hain.
    const company = await Company.findOne({ slug });

    // Agar company nahi mili to 404 return karenge.
    if (!company) {
      return res.status(404).json({
        message: "Company not found",
      });
    }

    // Company mil gayi, to frontend ko response bhej rahe hain.
    res.status(200).json({
      success: true,
      company,
    });

  } catch (error) {
    // Agar database/server mein error aaye to 500 return karenge.
    res.status(500).json({
      message: error.message,
    });
  }
};