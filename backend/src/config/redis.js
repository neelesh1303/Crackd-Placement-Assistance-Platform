const { createClient } = require("redis");

const redisClient = createClient({
    url: process.env.REDIS_URL,
    socket: {
        connectTimeout: 3000,
        reconnectStrategy: false
    }
});

redisClient.on("error", (err) => {
    console.error("Redis Error:", err);
});

const connectRedis = async () => {
    if (!process.env.REDIS_URL || redisClient.isReady) return;

    if (!redisClient.isOpen) {
        try {
            await redisClient.connect();
            console.log("Redis connected");
        } catch (error) {
            console.warn(`Redis unavailable; continuing without cache: ${error.message}`);
        }
    }
};

module.exports = {
    redisClient,
    connectRedis
};