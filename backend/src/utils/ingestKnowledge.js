const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const { resolveAtlasUri } = require("../config/db");

require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const KnowledgeChunk = require("../models/KnowledgeChunk");
const { createGeminiEmbedding } = require("../services/ragService");

function splitText(text, maxWords = 300) {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks = [];
  for (let index = 0; index < words.length; index += maxWords) {
    chunks.push(words.slice(index, index + maxWords).join(" "));
  }
  return chunks;
}

async function run() {
  const knowledgeDir = path.join(__dirname, "../data/knowledge");
  if (!fs.existsSync(knowledgeDir)) {
    console.log("[knowledge] No knowledge directory found; skipping.");
    return;
  }

  const files = fs.readdirSync(knowledgeDir).filter((file) => /\.(md|txt)$/i.test(file));
  if (!files.length) {
    console.log("[knowledge] No knowledge files found in directory.");
    return;
  }

  const uri = await resolveAtlasUri(process.env.MONGO_URI);
  await mongoose.connect(uri);
  await KnowledgeChunk.deleteMany({});

  for (const file of files) {
    const text = fs.readFileSync(path.join(knowledgeDir, file), "utf8");
    for (const content of splitText(text)) {
      const embedding = await createGeminiEmbedding(content, "RETRIEVAL_DOCUMENT");
      await KnowledgeChunk.create({ title: file, content, source: file, embedding });
      console.log(`[knowledge] Indexed ${file}`);
    }
  }

  await mongoose.disconnect();
  console.log("[knowledge] Ingestion completed successfully");
}

run().catch((error) => {
  console.error("[knowledge] Ingestion failed:", error.message);
  process.exit(1);
});