const KnowledgeChunk = require("../models/KnowledgeChunk");
const Problem = require("../models/Problem");
const Experience = require("../models/Experience");
require("../models/Company");

function getGeminiApiKey() {
  return (process.env.GEMINI_API_KEY || "").trim();
}

function getGeminiModel() {
  return (process.env.GEMINI_MODEL || "gemini-2.5-flash").trim();
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

async function retrieveContext(question, limit = 4) {
  try {
    const chunks = await KnowledgeChunk.find()
      .select("title content source embedding")
      .lean();

    if (!chunks || !chunks.length) return [];

    const validChunks = chunks.filter((chunk) => Array.isArray(chunk.embedding) && chunk.embedding.length > 0);
    if (!validChunks.length) return [];

    const questionEmbedding = await createGeminiEmbedding(question, "RETRIEVAL_QUERY");

    return validChunks
      .map((chunk) => ({
        ...chunk,
        score: cosineSimilarity(questionEmbedding, chunk.embedding),
      }))
      .filter((chunk) => chunk.score > -1)
      .sort((first, second) => second.score - first.score)
      .slice(0, limit);
  } catch (error) {
    console.warn(`[ragService] Semantic context retrieval bypassed: ${error.message}`);
    return [];
  }
}

const topicAliases = [
  { name: "Binary Search", aliases: ["binary search", "binary-search", "bs"] },
  { name: "Greedy", aliases: ["greedy", "greedy algorithm", "greedy algorithms"] },
  { name: "Dynamic Programming", aliases: ["dynamic programming", "dp"] },
  { name: "Sliding Window", aliases: ["sliding window"] },
  { name: "Two Pointers", aliases: ["two pointers", "2 pointers"] },
  { name: "Linked List", aliases: ["linked list", "linkedlist"] },
  { name: "Arrays", aliases: ["array", "arrays"] },
  { name: "Strings", aliases: ["string", "strings"] },
  { name: "Trees", aliases: ["tree", "trees"] },
  { name: "Graphs", aliases: ["graph", "graphs"] },
];

function findTopics(question) {
  const normalized = question.toLowerCase();
  return topicAliases.filter((topic) =>
    topic.aliases.some((alias) => normalized.includes(alias))
  );
}

function findRequestedYear(question) {
  const normalized = question.toLowerCase();
  const currentYear = new Date().getFullYear();
  if (normalized.includes("this year") || normalized.includes("current year")) return currentYear;
  if (normalized.includes("last year")) return currentYear - 1;
  const yearMatch = normalized.match(/\b(20\d{2})\b/);
  return yearMatch ? Number(yearMatch[1]) : null;
}

function topicMatches(value, topics) {
  const normalized = String(value || "").toLowerCase();
  return topics.some((topic) => topic.aliases.some((alias) => normalized.includes(alias)));
}

async function retrieveDatabaseContext(question) {
  try {
    const topics = findTopics(question);
    const year = findRequestedYear(question);
    const problemFilter = {};
    if (year) problemFilter.year = year;
    if (topics.length) {
      problemFilter.$or = topics.flatMap((topic) => [
        ...topic.aliases.map((alias) => ({ topic: { $regex: alias, $options: "i" } })),
        ...topic.aliases.map((alias) => ({ title: { $regex: alias, $options: "i" } })),
      ]);
    }

    const problems = await Problem.find(problemFilter)
      .populate("company", "name slug")
      .select("title topic askedInRound company year role")
      .sort({ year: -1, createdAt: -1 })
      .limit(50)
      .lean();

    const experiences = await Experience.find(year ? { year } : {})
      .populate("company", "name slug")
      .select("company role year rounds")
      .sort({ year: -1, createdAt: -1 })
      .limit(100)
      .lean();

    const matchingExperiences = topics.length
      ? experiences
          .map((experience) => ({
            ...experience,
            matchingRounds: (experience.rounds || []).filter((round) =>
              [...(round.topics || []), ...(round.problemsAsked || [])].some((value) =>
                topicMatches(value, topics)
              )
            ),
          }))
          .filter((experience) => experience.matchingRounds.length > 0)
      : experiences;

    const records = [
      ...problems.map((problem) => ({
        company: problem.company?.name || "Unknown company",
        year: problem.year,
        title: problem.title,
        topic: problem.topic,
        round: problem.askedInRound,
        role: problem.role,
      })),
      ...matchingExperiences.flatMap((experience) =>
        (topics.length ? experience.matchingRounds : experience.rounds || []).map((round) => ({
          company: experience.company?.name || "Unknown company",
          year: experience.year,
          title: (round.problemsAsked || []).join(", ") || "Interview round",
          topic: (round.topics || []).join(", "),
          round: round.type,
          role: experience.role,
        }))
      ),
    ];

    return { topics, year, records: records.slice(0, 80) };
  } catch (error) {
    console.warn(`[ragService] Database context retrieval bypassed: ${error.message}`);
    return { topics: [], year: null, records: [] };
  }
}

async function generateAnswer(body) {
  const configured = getGeminiModel();
  const candidateModels = [
    ...new Set([
      configured,
      "gemini-2.5-flash",
      "gemini-3.5-flash",
      "gemini-flash-latest",
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

function formatDatabaseContext({ topics, year, records }) {
  const topicLabel = topics.map((topic) => topic.name).join(", ");
  const scope = [topicLabel, year].filter(Boolean).join(" in ") || "the database";
  if (!records.length) {
    return `No matching database records were found for ${scope}. Do not invent companies or interview questions.`;
  }
  return [
    `Live MongoDB records matching ${scope}:`,
    ...records.map(
      (record) =>
        `- Company: ${record.company}; Year: ${record.year || "unspecified"}; Topic: ${record.topic || "unspecified"}; Question: ${record.title}; Round: ${record.round || "unspecified"}; Role: ${record.role || "unspecified"}`
    ),
  ].join("\n");
}

async function answerQuestion(question) {
  const [relevantChunks, databaseContext] = await Promise.all([
    retrieveContext(question),
    retrieveDatabaseContext(question),
  ]);
  const studyContext = relevantChunks
    .map((chunk, index) => `[Study source ${index + 1}: ${chunk.source}]\n${chunk.content}`)
    .join("\n\n");
  const databaseFacts = formatDatabaseContext(databaseContext);

  let answer = "";
  try {
    const data = await generateAnswer({
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 2048,
        thinkingConfig: { thinkingBudget: 0 },
      },
      systemInstruction: {
        parts: [
          {
            text: "You are Crackd's placement preparation assistant. Use live MongoDB records for company, year, topic, and interview-question facts. Use embedded study notes for explanations. Never invent a company, year, or question. If matching database records do not exist, say that clearly.",
          },
        ],
      },
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Live database context:\n${databaseFacts}\n\nEmbedded study-note context:\n${studyContext || "No embedded study notes were found."}\n\nQuestion:\n${question}`,
            },
          ],
        },
      ],
    });

    answer = extractAnswerText(data);
  } catch (genError) {
    console.warn("[ragService] LLM generation failed after all fallback attempts:", genError.message);

    if (databaseContext.records && databaseContext.records.length > 0) {
      const topRecords = databaseContext.records.slice(0, 8);
      const summaryList = topRecords
        .map((r) => `• **${r.company}** (${r.year || "Year N/A"}): ${r.title} [Round: ${r.round || "N/A"}, Topic: ${r.topic || "N/A"}]`)
        .join("\n");
      answer = `Here are the matching interview records found in the database for your query:\n\n${summaryList}\n\n*(Note: AI summary service is currently experiencing high demand; displaying direct database records).*`;
    } else {
      throw genError;
    }
  }

  if (!answer) {
    throw new Error("Gemini returned an empty answer");
  }

  return {
    answer,
    sources: [
      ...relevantChunks.map((chunk) => ({
        title: chunk.title,
        source: chunk.source,
        score: typeof chunk.score === "number" ? Number(chunk.score.toFixed(3)) : null,
      })),
      ...databaseContext.records.slice(0, 10).map((record) => ({
        title: `${record.company} - ${record.title}`,
        source: "MongoDB interview data",
        score: null,
      })),
    ],
  };
}

module.exports = { answerQuestion, createGeminiEmbedding };
