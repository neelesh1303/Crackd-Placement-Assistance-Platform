// Temporary diagnostic script - reproduces the RAG failure with the real Gemini API + Mongo.
require("dotenv").config({ path: require("path").join(__dirname, ".env") });

const mongoose = require("mongoose");
const { resolveAtlasUri } = require("./src/config/db");
const { answerQuestion } = require("./src/services/ragService");

const QUESTION = process.argv[2] || "what does fluxon ask";

async function run() {
  await mongoose.connect(await resolveAtlasUri(process.env.MONGO_URI), {
    serverSelectionTimeoutMS: 8000,
  });
  console.log("[repro] connected. knowledgechunks =", await mongoose.connection.db.collection("knowledgechunks").countDocuments());
  console.log("[repro] problems =", await mongoose.connection.db.collection("problems").countDocuments());
  console.log("[repro] experiences =", await mongoose.connection.db.collection("experiences").countDocuments());
  console.log("[repro] GEMINI_MODEL =", process.env.GEMINI_MODEL);
  console.log("[repro] question =", QUESTION);

  const started = Date.now();
  try {
    const result = await answerQuestion(QUESTION);
    console.log("[repro] OK in", Date.now() - started, "ms");
    console.log("[repro] answer:", JSON.stringify(result.answer).slice(0, 500));
    console.log("[repro] sources:", result.sources.length);
  } catch (error) {
    console.log("[repro] FAILED in", Date.now() - started, "ms");
    console.log("[repro] error.name =", error.name);
    console.log("[repro] error.message =", error.message);
  } finally {
    await mongoose.disconnect();
  }
}

run();
