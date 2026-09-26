const KnowledgeChunk = require("../models/KnowledgeChunk");
const Problem = require("../models/Problem");
const Experience = require("../models/Experience");
require("../models/Company");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const GEMINI_FALLBACK_MODEL = "gemini-2.5-flash";
const GEMINI_EMBEDDING_MODEL = process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-001";
const GEMINI_TIMEOUT_MS = Number(process.env.GEMINI_TIMEOUT_MS) || 60000;

async function callGemini(path, body) {
  if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is missing");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${path}?key=${encodeURIComponent(GEMINI_API_KEY)}`,
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
      throw new Error(`Gemini error ${response.status}: ${raw.slice(0, 500)}`);
    }
    return data;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error(`Gemini timed out after ${GEMINI_TIMEOUT_MS}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function createGeminiEmbedding(text, taskType) {
  const data = await callGemini(
    `models/${encodeURIComponent(GEMINI_EMBEDDING_MODEL)}:embedContent`,
    {
      model: `models/${GEMINI_EMBEDDING_MODEL}`,
      content: { parts: [{ text }] },
      taskType,
      outputDimensionality: 768,
    }
  );
  const values = data?.embedding?.values;
  if (!Array.isArray(values) || values.some((value) => typeof value !== "number")) {
    throw new Error("Gemini returned an invalid embedding");
  }
  return values;
}

function cosineSimilarity(first, second) {
  if (!first?.length || first.length !== second?.length) return -1;

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
  const chunks = await KnowledgeChunk.find()
    .select("title content source embedding")
    .lean();

  if (!chunks.length) return [];

  const questionEmbedding = await createGeminiEmbedding(question, "RETRIEVAL_QUERY");

  return chunks
    .filter((chunk) => Array.isArray(chunk.embedding) && chunk.embedding.length > 0)
    .map((chunk) => ({
      ...chunk,
      score: cosineSimilarity(questionEmbedding, chunk.embedding),
    }))
    .sort((first, second) => second.score - first.score)
    .slice(0, limit);
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
}

async function generateAnswer(body) {
  try {
    return await callGemini(`models/${encodeURIComponent(GEMINI_MODEL)}:generateContent`, body);
  } catch (error) {
    if (GEMINI_MODEL === GEMINI_FALLBACK_MODEL || !error.message.includes("Gemini error 503")) {
      throw error;
    }
    return callGemini(
      `models/${encodeURIComponent(GEMINI_FALLBACK_MODEL)}:generateContent`,
      body
    );
  }
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

  const answer = data?.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || "")
    .join("")
    .trim();
  if (!answer) throw new Error("Gemini returned an empty answer");

  return {
    answer,
    sources: [
      ...relevantChunks.map((chunk) => ({
        title: chunk.title,
        source: chunk.source,
        score: Number(chunk.score.toFixed(3)),
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
