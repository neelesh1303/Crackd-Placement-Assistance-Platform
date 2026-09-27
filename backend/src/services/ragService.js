const KnowledgeChunk = require("../models/KnowledgeChunk");
const Experience = require("../models/Experience");
require("../models/Company");

function getGeminiApiKey() {
  return (process.env.GEMINI_API_KEY || "").trim();
}

function getGeminiModel() {
  return (process.env.GEMINI_MODEL || "gemini-3.5-flash").trim();
}

function getGeminiEmbeddingModel() {
  return (process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-001").trim();
}

function getGeminiTimeoutMs() {
  return Number(process.env.GEMINI_TIMEOUT_MS) || 45000;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callGemini(path, body, { maxRetries = 1, timeoutMs = getGeminiTimeoutMs() } = {}) {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing from environment variables");
  }

  let attempt = 0;
  let lastError;

  while (attempt <= maxRetries) {
    attempt += 1;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/${path}?key=${encodeURIComponent(apiKey)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: controller.signal,
        }
      );

      const raw = await response.text();
      let data;
      try {
        data = JSON.parse(raw);
      } catch {
        data = null;
      }

      if (!response.ok) {
        const errorMsg = `Gemini error ${response.status}: ${raw.slice(0, 400)}`;
        const isTransient = response.status === 503 || response.status === 429 || response.status === 500;

        if (isTransient && attempt <= maxRetries) {
          console.warn(`[ragService] Transient Gemini error (${response.status}), retrying attempt ${attempt}...`);
          await sleep(500 * attempt);
          continue;
        }
        throw new Error(errorMsg);
      }

      return data;
    } catch (error) {
      if (error.name === "AbortError") {
        lastError = new Error(`Gemini request timed out after ${timeoutMs}ms`);
      } else {
        lastError = error;
      }

      if (attempt <= maxRetries && (lastError.message.includes("timed out") || lastError.message.includes("fetch failed"))) {
        console.warn(`[ragService] Network issue calling Gemini, retrying attempt ${attempt}...`);
        await sleep(500 * attempt);
        continue;
      }
      break;
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError;
}

async function createGeminiEmbedding(text, taskType) {
  const configured = getGeminiEmbeddingModel();
  const candidateModels = [...new Set([configured, "gemini-embedding-001", "gemini-embedding-2"].filter(Boolean))];
  let lastError;

  for (const model of candidateModels) {
    try {
      let data;
      try {
        data = await callGemini(
          `models/${encodeURIComponent(model)}:embedContent`,
          {
            model: `models/${model}`,
            content: { parts: [{ text }] },
            taskType,
            outputDimensionality: 768,
          },
          { maxRetries: 1, timeoutMs: 15000 }
        );
      } catch (dimErr) {
        if (dimErr.message.includes("400") || dimErr.message.includes("INVALID_ARGUMENT")) {
          data = await callGemini(
            `models/${encodeURIComponent(model)}:embedContent`,
            {
              model: `models/${model}`,
              content: { parts: [{ text }] },
              taskType,
            },
            { maxRetries: 1, timeoutMs: 15000 }
          );
        } else {
          throw dimErr;
        }
      }

      const values = data?.embedding?.values;
      if (Array.isArray(values) && values.length > 0 && typeof values[0] === "number") {
        return values;
      }
    } catch (err) {
      lastError = err;
      console.warn(`[ragService] Embedding attempt with model '${model}' failed: ${err.message}`);
    }
  }

  throw lastError || new Error("Failed to generate embedding with available models");
}

function formatExperienceToText(exp) {
  const companyName = exp.company?.name || exp.company || "Company";
  const role = exp.role || "Software Engineer";
  const year = exp.year || exp.visitYear || "Recent";
  const ctc = exp.ctc ? `CTC: ${exp.ctc} LPA` : "";
  const cutoff = exp.cgpaCutoff ? `CGPA Cutoff: ${exp.cgpaCutoff}` : "";

  const roundsText = (exp.rounds || [])
    .map((round) => {
      const parts = [
        `Round ${round.roundNo} (${round.type}):`,
        round.description ? `Description: ${round.description}` : "",
        round.problemsAsked?.length ? `Problems/Questions Asked: ${round.problemsAsked.join(", ")}` : "",
        round.topics?.length ? `Topics Covered: ${round.topics.join(", ")}` : "",
        round.duration ? `Duration: ${round.duration}` : "",
      ].filter(Boolean);
      return parts.join("\n");
    })
    .join("\n\n");

  const tips = exp.tips ? `Preparation Tips: ${exp.tips}` : "";
  const resources = exp.resources?.length ? `Resources Used: ${exp.resources.join(", ")}` : "";

  return [
    `Company: ${companyName}`,
    `Role: ${role}`,
    `Year: ${year}`,
    ctc,
    cutoff,
    "Interview Rounds & Questions:",
    roundsText,
    tips,
    resources,
  ]
    .filter(Boolean)
    .join("\n");
}

async function syncAllExperiences() {
  const experiences = await Experience.find().populate("company", "name slug").lean();
  if (!experiences.length) return;

  await KnowledgeChunk.deleteMany({});
  for (const exp of experiences) {
    const companyName = exp.company?.name || "Company";
    const text = formatExperienceToText(exp);
    const title = `${companyName} - ${exp.role} (${exp.year || "Interview"})`;
    const source = `${companyName} Interview Experience`;
    const embedding = await createGeminiEmbedding(text, "RETRIEVAL_DOCUMENT");
    await KnowledgeChunk.create({ title, content: text, source, embedding });
  }
}

async function indexSingleExperience(exp) {
  try {
    const populated = exp.company?.name ? exp : await Experience.findById(exp._id).populate("company", "name slug").lean();
    if (!populated) return;

    const companyName = populated.company?.name || "Company";
    const text = formatExperienceToText(populated);
    const title = `${companyName} - ${populated.role} (${populated.year || "Interview"})`;
    const source = `${companyName} Interview Experience`;
    const embedding = await createGeminiEmbedding(text, "RETRIEVAL_DOCUMENT");

    await KnowledgeChunk.findOneAndUpdate(
      { source },
      { title, content: text, source, embedding },
      { upsert: true, new: true }
    );
  } catch (error) {
    console.warn(`[ragService] Failed to index single experience: ${error.message}`);
  }
}

function cosineSimilarity(first, second) {
  if (!first?.length || !second?.length || first.length !== second.length) return -1;

  let dot = 0;
  let firstMagnitude = 0;
  let secondMagnitude = 0;
  for (let index = 0; index < first.length; index += 1) {
    dot += first[index] * second[index];
    firstMagnitude += first[index] * first[index];
    secondMagnitude += second[index] * second[index];
  }

  if (!firstMagnitude || !secondMagnitude) return -1;
  return dot / (Math.sqrt(firstMagnitude) * Math.sqrt(secondMagnitude));
}

async function retrieveContext(question, limit = 4, minSimilarity = 0.58) {
  try {
    let chunks = await KnowledgeChunk.find().select("title content source embedding").lean();

    if (!chunks || !chunks.length) {
      await syncAllExperiences();
      chunks = await KnowledgeChunk.find().select("title content source embedding").lean();
    }

    if (!chunks || !chunks.length) return [];

    const validChunks = chunks.filter((chunk) => Array.isArray(chunk.embedding) && chunk.embedding.length > 0);
    if (!validChunks.length) return [];

    const questionEmbedding = await createGeminiEmbedding(question, "RETRIEVAL_QUERY");

    const scoredChunks = validChunks
      .map((chunk) => ({
        ...chunk,
        score: cosineSimilarity(questionEmbedding, chunk.embedding),
      }))
      .filter((chunk) => chunk.score >= minSimilarity)
      .sort((first, second) => second.score - first.score);

    if (!scoredChunks.length) return [];

    const topScore = scoredChunks[0].score;
    // Keep chunks that are strongly relevant to the top score
    return scoredChunks
      .filter((chunk) => chunk.score >= Math.max(minSimilarity, topScore - 0.06))
      .slice(0, limit);
  } catch (error) {
    console.warn(`[ragService] Semantic context retrieval bypassed: ${error.message}`);
    return [];
  }
}

async function generateAnswer(body) {
  const configured = getGeminiModel();
  const candidateModels = [
    ...new Set([
      configured,
      "gemini-3.5-flash",
      "gemini-flash-latest",
      "gemini-2.5-flash-lite",
      "gemini-3.7-flash",
      "gemini-2.5-flash",
    ].filter(Boolean)),
  ];

  let lastError;

  for (const model of candidateModels) {
    try {
      const res = await callGemini(`models/${encodeURIComponent(model)}:generateContent`, body);
      return res;
    } catch (err) {
      lastError = err;
      console.warn(`[ragService] Model '${model}' generateContent failed: ${err.message}`);

      if (body?.generationConfig?.thinkingConfig && (err.message.includes("400") || err.message.includes("INVALID_ARGUMENT"))) {
        try {
          const bodyWithoutThinking = {
            ...body,
            generationConfig: {
              ...body.generationConfig,
              thinkingConfig: undefined,
            },
          };
          const res = await callGemini(`models/${encodeURIComponent(model)}:generateContent`, bodyWithoutThinking);
          return res;
        } catch (retryErr) {
          lastError = retryErr;
        }
      }
    }
  }

  throw lastError || new Error("All Gemini generation candidate models failed");
}

function extractAnswerText(data) {
  const candidate = data?.candidates?.[0];
  if (!candidate) return "";

  const parts = candidate.content?.parts || [];
  const textParts = parts
    .filter((part) => !part.thought && typeof part.text === "string")
    .map((part) => part.text);

  if (textParts.length > 0) {
    return textParts.join("").trim();
  }

  return parts
    .map((part) => part.text || "")
    .join("")
    .trim();
}

async function answerQuestion(question) {
  const relevantChunks = await retrieveContext(question);

  if (!relevantChunks || relevantChunks.length === 0) {
    return {
      answer: "I don't have data related to this in my interview knowledge base.",
      sources: [],
    };
  }

  const contextText = relevantChunks
    .map((chunk, index) => `[Source ${index + 1}: ${chunk.source}]\n${chunk.content}`)
    .join("\n\n");

  const data = await generateAnswer({
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 1024,
    },
    systemInstruction: {
      parts: [
        {
          text: `You are Crackd's placement preparation assistant. Answer the user question using ONLY the provided interview context.

Strict Rules:
1. If the provided context contains the relevant interview information (e.g. what a company asked, rounds, topics, problems, tips), provide a clear, structured, and helpful answer grounded strictly in the context.
2. If the user asks about something that is NOT found in the provided context (e.g., general CS theory like "what is computer networks", unrelated subjects, or companies not in context), you MUST respond with: "I don't have data related to this in my interview knowledge base."
3. Do not invent or hallucinate facts outside the provided context.`,
        },
      ],
    },
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Retrieved Context:\n${contextText}\n\nUser Question:\n${question}`,
          },
        ],
      },
    ],
  });

  const answer = extractAnswerText(data);
  if (!answer) {
    throw new Error("Gemini returned an empty answer");
  }

  const isRefusal = /i don't have data related to this/i.test(answer) || /i do not have data related to this/i.test(answer);

  return {
    answer,
    sources: isRefusal
      ? []
      : relevantChunks.map((chunk) => ({
          title: chunk.title,
          source: chunk.source,
          score: typeof chunk.score === "number" ? Number(chunk.score.toFixed(3)) : null,
        })),
  };
}

module.exports = {
  answerQuestion,
  createGeminiEmbedding,
  formatExperienceToText,
  syncAllExperiences,
  indexSingleExperience,
};
