const KnowledgeChunk = require("../models/KnowledgeChunk");
const Experience = require("../models/Experience");
const Company = require("../models/Company");

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
  try {
    const experiences = await Experience.find().populate("company", "name slug").lean();
    if (!experiences.length) return;

    for (const exp of experiences) {
      const companyName = exp.company?.name || "Company";
      const text = formatExperienceToText(exp);
      const title = `${companyName} - ${exp.role} (${exp.year || "Interview"})`;
      const source = `${companyName} Interview Experience`;

      let embedding = [];
      try {
        embedding = await createGeminiEmbedding(text, "RETRIEVAL_DOCUMENT");
      } catch (embErr) {
        console.warn(`[ragService] Could not generate embedding during sync for ${companyName}: ${embErr.message}`);
      }

      await KnowledgeChunk.findOneAndUpdate(
        { source },
        { title, content: text, source, ...(embedding.length ? { embedding } : {}) },
        { upsert: true, new: true }
      );
    }
  } catch (err) {
    console.warn(`[ragService] syncAllExperiences error: ${err.message}`);
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

    let embedding = [];
    try {
      embedding = await createGeminiEmbedding(text, "RETRIEVAL_DOCUMENT");
    } catch (embErr) {
      console.warn(`[ragService] Could not generate embedding for new experience: ${embErr.message}`);
    }

    await KnowledgeChunk.findOneAndUpdate(
      { source },
      { title, content: text, source, ...(embedding.length ? { embedding } : {}) },
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

// Keyword & company name match fallback (Hybrid RAG)
async function findKeywordMatches(question) {
  try {
    const normalized = question.toLowerCase();
    const companies = await Company.find().select("name slug").lean();

    const matchedCompanies = companies.filter((c) => {
      const name = (c.name || "").toLowerCase();
      const slug = (c.slug || "").toLowerCase();
      return (name && normalized.includes(name)) || (slug && normalized.includes(slug));
    });

    if (!matchedCompanies.length) return [];

    const matchedCompanyIds = matchedCompanies.map((c) => c._id);
    const experiences = await Experience.find({ company: { $in: matchedCompanyIds } })
      .populate("company", "name slug")
      .lean();

    return experiences.map((exp) => {
      const companyName = exp.company?.name || "Company";
      const text = formatExperienceToText(exp);
      return {
        title: `${companyName} - ${exp.role} (${exp.year || "Interview"})`,
        content: text,
        source: `${companyName} Interview Experience`,
        score: 0.95,
      };
    });
  } catch (err) {
    console.warn(`[ragService] Keyword match fallback failed: ${err.message}`);
    return [];
  }
}

async function retrieveContext(question, limit = 4, minSimilarity = 0.52) {
  try {
    let chunks = await KnowledgeChunk.find().select("title content source embedding").lean();

    if (!chunks || !chunks.length) {
      await syncAllExperiences();
      chunks = await KnowledgeChunk.find().select("title content source embedding").lean();
    }

    let semanticResults = [];

    try {
      const validChunks = (chunks || []).filter((chunk) => Array.isArray(chunk.embedding) && chunk.embedding.length > 0);
      if (validChunks.length) {
        const questionEmbedding = await createGeminiEmbedding(question, "RETRIEVAL_QUERY");

        const scoredChunks = validChunks
          .map((chunk) => ({
            ...chunk,
            score: cosineSimilarity(questionEmbedding, chunk.embedding),
          }))
          .filter((chunk) => chunk.score >= minSimilarity)
          .sort((first, second) => second.score - first.score);

        if (scoredChunks.length > 0) {
          const topScore = scoredChunks[0].score;
          semanticResults = scoredChunks
            .filter((chunk) => chunk.score >= Math.max(minSimilarity, topScore - 0.12))
            .slice(0, limit);
        }
      }
    } catch (semanticError) {
      console.warn(`[ragService] Semantic embedding search failed or bypassed: ${semanticError.message}`);
    }

    // If semantic retrieval returned high-confidence matches, return them
    if (semanticResults.length > 0) {
      return semanticResults;
    }

    // Fallback: Check if query explicitly targets recorded companies in DB
    const keywordResults = await findKeywordMatches(question);
    if (keywordResults.length > 0) {
      return keywordResults.slice(0, limit);
    }

    return [];
  } catch (error) {
    console.warn(`[ragService] Context retrieval failed: ${error.message}`);
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
