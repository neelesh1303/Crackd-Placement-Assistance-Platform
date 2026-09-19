const dotenv = require("dotenv");
const { connectRedis } = require("./config/redis");
dotenv.config(); // env file ko PEHLE load karo, fir app require karo

const connectDB = require("./config/db");
const app = require("./app");


const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  try {
    await connectRedis();
  } catch (error) {
    console.warn(`Redis unavailable; starting API without Redis: ${error.message}`);
  }

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();