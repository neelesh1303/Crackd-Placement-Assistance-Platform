const dotenv = require("dotenv");
dotenv.config(); // env file ko PEHLE load karo, fir app require karo
const connectDB = require("./config/db");
const app = require("./app");
const { connectRedis } = require("./config/redis");
const { syncAllExperiences } = require("./services/ragService");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  await connectRedis();

  // Ensure knowledge chunks are synced on startup for RAG
  syncAllExperiences().catch((err) =>
    console.warn("[server] Background knowledge sync warning:", err.message)
  );

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();