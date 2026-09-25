const { createClient } = require("redis");

const rawRedisUrl = process.env.REDIS_URL || "";
const redisUrl = /^(rediss?):\/\/\S+$/.test(rawRedisUrl.trim())
    ? rawRedisUrl.trim()
    : "";

const redisClient = createClient({
    ...(redisUrl ? { url: redisUrl } : {}),
    socket: {
        connectTimeout: 3000,
        reconnectStrategy: false
    }
});

redisClient.on("error", (err) => {
    console.error("Redis Error:", err);
});

const connectRedis = async () => {
    if (!redisUrl || redisClient.isReady) return;

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