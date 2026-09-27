const path = require("path");
const mongoose = require("mongoose");
const { resolveAtlasUri } = require("../config/db");

require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const { syncAllExperiences } = require("../services/ragService");
const KnowledgeChunk = require("../models/KnowledgeChunk");

async function run() {
  console.log("[knowledge] Starting knowledge ingestion from MongoDB experiences...");
  const uri = await resolveAtlasUri(process.env.MONGO_URI);
  await mongoose.connect(uri);

  await syncAllExperiences();

  const count = await KnowledgeChunk.countDocuments();
  console.log(`[knowledge] Ingestion completed. Total indexed chunks in KnowledgeChunk: ${count}`);

  await mongoose.disconnect();
}

run().catch((error) => {
  console.error("[knowledge] Ingestion failed:", error.message);
  process.exit(1);
});