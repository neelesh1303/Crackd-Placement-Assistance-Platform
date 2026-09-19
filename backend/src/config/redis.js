const { createClient } = require("redis");

const configuredRedisUrl = process.env.REDIS_URL?.trim();
const redisUrl = configuredRedisUrl
    ?.replace(/^redis-cli\s+--tls\s+-u\s+/i, "")
    .replace(/^redis:\/\//i, "rediss://");

const redisClient = createClient({
    url: redisUrl,
    socket: {
        connectTimeout: 5000
    }
});

redisClient.on("error", (err) => {
    console.error("Redis Error:", err);
});

const connectRedis = async () => {
    if (!redisUrl) {
        console.warn("Redis is not configured; continuing without Redis");
        return false;
    }

    if (!redisClient.isOpen) {
        await redisClient.connect();
        console.log("Redis connected");
    }

    return true;
};

module.exports = {
    redisClient,
    connectRedis
};