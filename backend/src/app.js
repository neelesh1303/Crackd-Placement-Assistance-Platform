const express = require("express");
const cors = require("cors");
const experienceRoutes = require("./routes/experienceRoutes");

const roadmapRoutes = require("./routes/roadmapRoutes");
const trackerRoutes = require("./routes/trackerRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/experiences", experienceRoutes); //ye line backend me /api/experiences path ke sath experienceRoutes ko mount karti hai. jab bhi frontend se /api/experiences par request aayegi, to ye experienceRoutes me defined routes ke according handle ki jayegi.
// Health route to quickly verify backend is alive
app.get("/api/health", (req, res) => {
  res.status(200).json({ message: "Crackd. API running" });
});
app.use("/api/roadmap", roadmapRoutes);
app.use("/api/tracker", trackerRoutes);

// Import auth routes
const authRoutes = require("./routes/authRoutes");

const companyRoutes = require("./routes/companyRoutes"); // Import company routes. This line imports the company routes from the companyRoutes.js file, which contains the route definitions for handling requests related to companies. By importing these routes, we can use them in our main app to handle requests to the /api/companies endpoint.

// after other app.use lines
app.use("/api/companies", companyRoutes);

// Use auth routes
app.use("/api/auth", authRoutes);

module.exports = app;