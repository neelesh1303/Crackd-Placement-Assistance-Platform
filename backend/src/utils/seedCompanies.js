const dotenv = require("dotenv");
const connectDB = require("../config/db");
const Company = require("../models/Company");

dotenv.config();

const companies = [
  {
    name: "Amazon",
    slug: "amazon",
    logo: "",
    roles: ["SDE Intern", "SDE-1"],
    visitMonth: "August",
    difficulty: "Hard",
  },
  {
    name: "Microsoft",
    slug: "microsoft",
    logo: "",
    roles: ["SWE Intern", "SDE-1"],
    visitMonth: "September",
    difficulty: "Hard",
  },
  {
    name: "Google",
    slug: "google",
    logo: "",
    roles: ["SWE Intern", "SWE"],
    visitMonth: "October",
    difficulty: "Hard",
  },
  {
    name: "Adobe",
    slug: "adobe",
    logo: "",
    roles: ["MTS", "Intern"],
    visitMonth: "August",
    difficulty: "Medium",
  },
  {
    name: "Oracle",
    slug: "oracle",
    logo: "",
    roles: ["Associate Consultant", "SDE"],
    visitMonth: "September",
    difficulty: "Medium",
  },
  {
    name: "Walmart",
    slug: "walmart",
    logo: "",
    roles: ["SDE-1", "Grad Engineer"],
    visitMonth: "July",
    difficulty: "Medium",
  },
  {
    name: "SAP",
    slug: "sap",
    logo: "",
    roles: ["Developer Associate"],
    visitMonth: "September",
    difficulty: "Medium",
  },
  {
    name: "PayPal",
    slug: "paypal",
    logo: "",
    roles: ["Software Engineer", "Intern"],
    visitMonth: "August",
    difficulty: "Hard",
  },
  {
    name: "Goldman Sachs",
    slug: "goldman-sachs",
    logo: "",
    roles: ["Analyst", "Engineer"],
    visitMonth: "July",
    difficulty: "Hard",
  },
  {
    name: "Infosys",
    slug: "infosys",
    logo: "",
    roles: ["SE", "DSE"],
    visitMonth: "November",
    difficulty: "Easy",
  },
];

const seedCompanies = async () => {
  try {
    await connectDB();
    await Company.deleteMany();
    await Company.insertMany(companies);
    console.log("Companies seeded successfully");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error.message);
    process.exit(1);
  }
};

seedCompanies();

//this file is a database seeding script that fills the companies collection in the MongoDB database with a predefined list of companies. it connects to the database, clears any existing company data, and then inserts the new company data from the companies array. this is useful for testing and development purposes, allowing us to have a consistent set of company data to work with when building and testing the application.