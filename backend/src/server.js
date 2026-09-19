const dotenv = require("dotenv");
dotenv.config(); // env file ko PEHLE load karo, fir app require karo
const { connectRedis } = require("./config/redis");

const connectDB = require("./config/db");
const app = require("./app");


const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  await connectRedis();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();