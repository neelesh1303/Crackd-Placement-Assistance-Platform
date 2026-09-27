const dns = require("dns");

try {
  // Atlas mongodb+srv records can occasionally fail on certain local network DNS setups.
  // We attempt setting reliable resolvers, but silently ignore if prohibited in container/cloud environments.
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch {
  // Ignore in restricted environments
}

const mongoose = require("mongoose");

async function resolveAtlasUri(uri) {
  if (!uri || typeof uri !== "string" || !uri.startsWith("mongodb+srv://")) return uri;

  try {
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
  } catch (err) {
    // If custom SRV lookup fails in deployment (e.g. cloud VPC DNS restrictions), fallback to raw URI
    return uri;
  }
}

const connectDB = async () => {
  try {
    const rawUri = process.env.MONGO_URI;
    if (!rawUri) {
      console.error("MongoDB connection failed: MONGO_URI is missing from environment variables");
      process.exit(1);
    }
    let connectionUri = rawUri;
    try {
      connectionUri = await resolveAtlasUri(rawUri);
    } catch {
      connectionUri = rawUri;
    }

    await mongoose.connect(connectionUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 8000,
    });
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
module.exports.resolveAtlasUri = resolveAtlasUri;