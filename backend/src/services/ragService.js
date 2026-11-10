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

// ---------------------------------------------------------------------------
// In-memory caches (per server process) — keep the chat fast.
// Knowledge chunks / companies are reloaded at most every CACHE_TTL_MS, and
// cleared whenever an experience is (re)indexed.
// ---------------------------------------------------------------------------
const CACHE_TTL_MS = 5 * 60 * 1000;
const ANSWER_TTL_MS = 10 * 60 * 1000;
const MAX_CACHE_ENTRIES = 200;

let chunkCache = { data: null, at: 0 };
let companyCache = { data: null, at: 0 };
const embeddingCache = new Map(); // normalized question -> embedding
const answerCache = new Map(); // normalized question -> { value, at }

function normalizeQuestion(question) {
  return String(question || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function rememberInMap(map, key, value) {
  if (map.size >= MAX_CACHE_ENTRIES) map.delete(map.keys().next().value); // drop oldest
  map.set(key, value);
}

function invalidateKnowledgeCache() {
  chunkCache = { data: null, at: 0 };
  companyCache = { data: null, at: 0 };
  answerCache.clear();
}

async function getKnowledgeChunks() {
  if (chunkCache.data && Date.now() - chunkCache.at < CACHE_TTL_MS) return chunkCache.data;
  const data = await KnowledgeChunk.find().select("title content source embedding").lean();
  chunkCache = { data, at: Date.now() };
  return data;
}

async function getCompanies() {
  if (companyCache.data && Date.now() - companyCache.at < CACHE_TTL_MS) return companyCache.data;
  const data = await Company.find().select("name slug").lean();
  companyCache = { data, at: Date.now() };
  return data;
}

function getCachedAnswer(question) {
  const key = normalizeQuestion(question);
  const hit = answerCache.get(key);
  if (hit && Date.now() - hit.at < ANSWER_TTL_MS) return hit.value;
  if (hit) answerCache.delete(key);
  return null;
}

function cacheAnswer(question, value) {
  rememberInMap(answerCache, normalizeQuestion(question), { value, at: Date.now() });
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
    invalidateKnowledgeCache();
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
    invalidateKnowledgeCache();
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
    const companies = await getCompanies();

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
    let chunks = await getKnowledgeChunks();

    if (!chunks || !chunks.length) {
      await syncAllExperiences();
      chunks = await getKnowledgeChunks();
    }

    let semanticResults = [];

    try {
      const validChunks = (chunks || []).filter((chunk) => Array.isArray(chunk.embedding) && chunk.embedding.length > 0);
      if (validChunks.length) {
        const embeddingKey = normalizeQuestion(question);
        let questionEmbedding = embeddingCache.get(embeddingKey);
        if (!questionEmbedding) {
          questionEmbedding = await createGeminiEmbedding(question, "RETRIEVAL_QUERY");
          rememberInMap(embeddingCache, embeddingKey, questionEmbedding);
        }

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

// The model that last worked is tried first next time, so a broken primary model
// doesn't cost a failed round-trip on every question.
let preferredModel = null;

function getCandidateModels() {
  const configured = getGeminiModel();
  return [
    ...new Set([
      preferredModel,
      configured,
      "gemini-3.5-flash",
      "gemini-flash-latest",
      "gemini-2.5-flash-lite",
      "gemini-3.7-flash",
      "gemini-2.5-flash",
    ].filter(Boolean)),
  ];
}

function withoutThinking(body) {
  return {
    ...body,
    generationConfig: {
      ...body.generationConfig,
      thinkingConfig: undefined,
    },
  };
}

function isBadRequest(err) {
  return err.message.includes("400") || err.message.includes("INVALID_ARGUMENT");
}

async function generateAnswer(body) {
  let lastError;

  for (const model of getCandidateModels()) {
    try {
      const res = await callGemini(`models/${encodeURIComponent(model)}:generateContent`, body);
      preferredModel = model;
      return res;
    } catch (err) {
      lastError = err;
      console.warn(`[ragService] Model '${model}' generateContent failed: ${err.message}`);

      if (body?.generationConfig?.thinkingConfig && isBadRequest(err)) {
        try {
          const res = await callGemini(`models/${encodeURIComponent(model)}:generateContent`, withoutThinking(body));
          preferredModel = model;
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

const NO_DATA_ANSWER = "I don't have data related to this in my interview knowledge base.";

const SYSTEM_PROMPT = `You are Crackd bot, a friendly placement-prep assistant for college students. Answer the user question using ONLY the provided interview context.

Strict Rules:
1. If the provided context contains the relevant interview information (e.g. what a company asked, rounds, topics, problems, tips), give a clear, helpful answer grounded strictly in the context.
2. If the user asks about something that is NOT found in the provided context (e.g., general CS theory like "what is computer networks", unrelated subjects, or companies not in context), you MUST respond with exactly: "${NO_DATA_ANSWER}"
3. Do not invent or hallucinate facts outside the provided context.

Formatting (Markdown):
- Start with one short sentence that directly answers the question.
- Use "### " headings only when the answer has 2 or more distinct parts.
- Use "- " bullets; nest sub-points with two spaces. Put the label in bold, e.g. "- **Duration:** 60 minutes".
- Use \`backticks\` for problem names, *italics* sparingly.
- No tables, no horizontal rules, no closing summary or sign-off.
- Keep it tight: about 200 words at most.`;

function buildAnswerRequest(question, relevantChunks) {
  const contextText = relevantChunks
    .map((chunk, index) => `[Source ${index + 1}: ${chunk.source}]\n${chunk.content}`)
    .join("\n\n");

  return {
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 800,
      // grounded Q&A doesn't need the model's thinking pass — skipping it cuts latency a lot
      thinkingConfig: { thinkingBudget: 0 },
    },
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [
      {
        role: "user",
        parts: [{ text: `Retrieved Context:\n${contextText}\n\nUser Question:\n${question}` }],
      },
    ],
  };
}

function isRefusal(answer) {
  return /i (don't|do not) have data related to this/i.test(answer);
}

function buildSources(answer, relevantChunks) {
  if (isRefusal(answer)) return [];
  return relevantChunks.map((chunk) => ({
    title: chunk.title,
    source: chunk.source,
    score: typeof chunk.score === "number" ? Number(chunk.score.toFixed(3)) : null,
  }));
}

async function answerQuestion(question) {
  const cached = getCachedAnswer(question);
  if (cached) return cached;

  const relevantChunks = await retrieveContext(question);

  if (!relevantChunks || relevantChunks.length === 0) {
    return { answer: NO_DATA_ANSWER, sources: [] };
  }

  const data = await generateAnswer(buildAnswerRequest(question, relevantChunks));

  const answer = extractAnswerText(data);
  if (!answer) {
    throw new Error("Gemini returned an empty answer");
  }

  const result = { answer, sources: buildSources(answer, relevantChunks) };
  cacheAnswer(question, result);
  return result;
}

// ---------------------------------------------------------------------------
// Streaming: sends the answer to the client as Gemini writes it.
// ---------------------------------------------------------------------------

// Opens a Gemini SSE stream for one model. Resolves once the response headers arrive.
async function openGeminiStream(model, body, timeoutMs) {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing from environment variables");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:streamGenerateContent?alt=sse&key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      }
    );
    if (!response.ok) {
      const raw = await response.text();
      clearTimeout(timeout);
      throw new Error(`Gemini error ${response.status}: ${raw.slice(0, 400)}`);
    }
    return { response, controller, timeout };
  } catch (error) {
    clearTimeout(timeout);
    if (error.name === "AbortError") throw new Error(`Gemini request timed out after ${timeoutMs}ms`);
    throw error;
  }
}

async function openStreamWithFallback(body) {
  let lastError;
  for (const model of getCandidateModels()) {
    try {
      const stream = await openGeminiStream(model, body, getGeminiTimeoutMs());
      preferredModel = model;
      return stream;
    } catch (err) {
      lastError = err;
      console.warn(`[ragService] Model '${model}' stream failed: ${err.message}`);
      if (body?.generationConfig?.thinkingConfig && isBadRequest(err)) {
        try {
          const stream = await openGeminiStream(model, withoutThinking(body), getGeminiTimeoutMs());
          preferredModel = model;
          return stream;
        } catch (retryErr) {
          lastError = retryErr;
        }
      }
    }
  }
  throw lastError || new Error("All Gemini generation candidate models failed");
}

// Reads Gemini's SSE body and calls onText for every text delta. Returns the full text.
async function readGeminiStream({ response, controller, timeout }, onText) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";

  const handleEvent = (rawEvent) => {
    const dataLines = rawEvent
      .split("\n")
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trim());
    if (!dataLines.length) return;
    let payload;
    try {
      payload = JSON.parse(dataLines.join(""));
    } catch {
      return;
    }
    const parts = payload?.candidates?.[0]?.content?.parts || [];
    const text = parts
      .filter((part) => !part.thought && typeof part.text === "string")
      .map((part) => part.text)
      .join("");
    if (text) {
      full += text;
      onText(text);
    }
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, "\n");
      let boundary = buffer.indexOf("\n\n");
      while (boundary !== -1) {
        handleEvent(buffer.slice(0, boundary));
        buffer = buffer.slice(boundary + 2);
        boundary = buffer.indexOf("\n\n");
      }
    }
    if (buffer.trim()) handleEvent(buffer);
  } catch (error) {
    if (error.name === "AbortError") throw new Error("Gemini stream timed out");
    throw error;
  } finally {
    clearTimeout(timeout);
    controller.abort();
  }

  return full.trim();
}

// emit(event, data): event is "delta" ({ text }) or "done" ({ answer, sources })
async function answerQuestionStream(question, emit) {
  const cached = getCachedAnswer(question);
  if (cached) {
    emit("delta", { text: cached.answer });
    emit("done", cached);
    return;
  }

  const relevantChunks = await retrieveContext(question);
  if (!relevantChunks || relevantChunks.length === 0) {
    const result = { answer: NO_DATA_ANSWER, sources: [] };
    emit("delta", { text: result.answer });
    emit("done", result);
    return;
  }

  const stream = await openStreamWithFallback(buildAnswerRequest(question, relevantChunks));
  const answer = await readGeminiStream(stream, (text) => emit("delta", { text }));
  if (!answer) {
    throw new Error("Gemini returned an empty answer");
  }

  const result = { answer, sources: buildSources(answer, relevantChunks) };
  cacheAnswer(question, result);
  emit("done", result);
}

module.exports = {
  answerQuestion,
  answerQuestionStream,
  createGeminiEmbedding,
  generateGeminiContent: generateAnswer,
  extractAnswerText,
  formatExperienceToText,
  syncAllExperiences,
  indexSingleExperience,
};
