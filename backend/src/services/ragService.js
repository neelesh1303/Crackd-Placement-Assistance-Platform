const KnowledgeChunk = require("../models/KnowledgeChunk");
const Problem = require("../models/Problem");
const Experience = require("../models/Experience");
require("../models/Company");

const HF_API_TOKEN = process.env.HF_API_TOKEN;
const HF_MODEL = process.env.HF_MODEL || "meta-llama/Llama-3.1-8B-Instruct";
const HF_EMBEDDING_MODEL =
  process.env.HF_EMBEDDING_MODEL || "sentence-transformers/all-MiniLM-L6-v2";
const HF_TIMEOUT_MS = Number(process.env.HF_TIMEOUT_MS) || 60000;

async function callHuggingFace(url, body) {
  if (!HF_API_TOKEN) throw new Error("HF_API_TOKEN is missing");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), HF_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${HF_API_TOKEN}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const raw = await response.text();
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      data = null;
    }

    if (!response.ok) {
      throw new Error(`Hugging Face error ${response.status}: ${raw.slice(0, 300)}`);
    }

    return data;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error(`Hugging Face timed out after ${HF_TIMEOUT_MS}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function scoreSimilarities(question, documents) {
  const data = await callHuggingFace(
    `https://router.huggingface.co/hf-inference/models/${encodeURIComponent(HF_EMBEDDING_MODEL)}`,
    {
    inputs: {
      source_sentence: question,
      sentences: documents,
    },
    options: { wait_for_model: true },
    }
  );

  if (!Array.isArray(data) || data.some((score) => typeof score !== "number")) {
    throw new Error("Hugging Face returned invalid similarity scores");
  }
  return data;
}

async function retrieveContext(question, limit = 4) {
  const chunks = await KnowledgeChunk.find().select("title content source").lean();
  if (!chunks.length) return [];

  const scores = await scoreSimilarities(
    question,
    chunks.map((chunk) => chunk.content)
  );

  return chunks
    .map((chunk, index) => ({ ...chunk, score: scores[index] }))
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
  if (normalized.includes("this year") || normalized.includes("current year")) {
    return currentYear;
  }
  if (normalized.includes("last year")) return currentYear - 1;

  const yearMatch = normalized.match(/\b(20\d{2})\b/);
  return yearMatch ? Number(yearMatch[1]) : null;
}

function topicMatches(value, topics) {
  const normalized = String(value || "").toLowerCase();
  return topics.some((topic) =>
    topic.aliases.some((alias) => normalized.includes(alias))
  );
}

async function retrieveDatabaseContext(question) {
  const topics = findTopics(question);
  const year = findRequestedYear(question);
  const problemFilter = {};
  if (year) problemFilter.year = year;
  if (topics.length) {
    problemFilter.$or = [
      ...topics.flatMap((topic) => [
        ...topic.aliases.map((alias) => ({ topic: { $regex: alias, $options: "i" } })),
        ...topic.aliases.map((alias) => ({ title: { $regex: alias, $options: "i" } })),
      ]),
    ];
  }

  const problems = await Problem.find(problemFilter)
    .populate("company", "name slug")
    .select("title topic difficulty askedInRound company year role notes")
    .sort({ year: -1, createdAt: -1 })
    .limit(50)
    .lean();

  const experienceFilter = year ? { year } : {};
  const experiences = await Experience.find(experienceFilter)
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
      type: "problem",
      company: problem.company?.name || "Unknown company",
      year: problem.year,
      title: problem.title,
      topic: problem.topic,
      round: problem.askedInRound,
      role: problem.role,
    })),
    ...matchingExperiences.flatMap((experience) =>
      (topics.length ? experience.matchingRounds : experience.rounds || []).map((round) => ({
        type: "experience",
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

function formatDatabaseContext(databaseContext) {
  const { topics, year, records } = databaseContext;
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
  const context = relevantChunks
    .map((chunk, index) => `[Source ${index + 1}: ${chunk.source}]\n${chunk.content}`)
    .join("\n\n");
  const databaseFacts = formatDatabaseContext(databaseContext);

  const data = await callHuggingFace("https://router.huggingface.co/v1/chat/completions", {
    model: HF_MODEL,
    messages: [
      {
        role: "system",
        content:
          "You are Crackd's placement preparation assistant. Answer using the live MongoDB records first for company, year, topic, and interview-question questions. Use study notes only for explanations. Never invent a company, year, or question. If the database says no matching records were found, say so clearly.",
      },
      {
        role: "user",
        content: `Live database context:\n${databaseFacts}\n\nStudy-note context:\n${context || "No study notes were found."}\n\nQuestion:\n${question}`,
      },
    ],
    temperature: 0.2,
    max_tokens: 500,
  });

  const answer = data?.choices?.[0]?.message?.content?.trim();
  if (!answer) throw new Error("Hugging Face returned an empty chat response");

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

module.exports = { answerQuestion };