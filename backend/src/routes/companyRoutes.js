// const express = require("express");
// const router = express.Router();
// const { getCompanies } = require("../controllers/companyController");

// router.get("/", getCompanies); //this route is used to get the list of all companies from the database. when a GET request is made to the root path ("/") of this router, the getCompanies controller function will be called, which will retrieve the companies from the database and send them back in the response.

// module.exports = router;

const express = require("express");
const router = express.Router();
const { getCompanies, getCompanyBySlug } = require("../controllers/companyController");

router.get("/", getCompanies); //ye route sabhi companies ki list ko fetch karne ke liye hai. jab frontend se /api/companies par GET request aayegi, to ye route trigger hoga aur getCompanies controller function call hoga. is function me database se sabhi companies ko retrieve karke response me bhej diya jata hai, jisse frontend par companies ki list display ki ja sakti hai.
router.get("/:slug", getCompanyBySlug); //ye route company ke slug ke basis par company data fetch karne ke liye hai. jab frontend se /api/companies/:slug par GET request aayegi, to ye route trigger hoga aur getCompanyBySlug controller function call hoga. is function me req.params.slug se slug ki value milti hai, jisse database me company ko find kiya jata hai. agar company mil jati hai to uska data response me bhej diya jata hai, warna 404 error return kiya jata hai.

module.exports = router;