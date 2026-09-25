const dns = require("dns");

// Atlas mongodb+srv records are unavailable through this machine's default resolver.
dns.setServers(["8.8.8.8"]);

const mongoose = require("mongoose");

async function resolveAtlasUri(uri) {
  if (!uri.startsWith("mongodb+srv://")) return uri;

  const parsed = new URL(uri);
  const srvRecords = await dns.promises.resolveSrv(`_mongodb._tcp.${parsed.hostname}`);
  const txtRecords = await dns.promises.resolveTxt(parsed.hostname);
  const txtOptions = txtRecords.flat().join("&");
  const options = new URLSearchParams(parsed.search);

  for (const pair of new URLSearchParams(txtOptions)) {
    if (!options.has(pair[0])) options.set(pair[0], pair[1]);
  }
  options.set("tls", "true");

  const credentials = parsed.username
    ? `${parsed.username}:${parsed.password}@`
    : "";
  const hosts = srvRecords.map((record) => `${record.name}:${record.port}`).join(",");

  return `mongodb://${credentials}${hosts}${parsed.pathname || "/"}?${options.toString()}`;
}

const connectDB = async () => {
  try {
    const connectionUri = await resolveAtlasUri(process.env.MONGO_URI);
    await mongoose.connect(connectionUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
module.exports.resolveAtlasUri = resolveAtlasUri;