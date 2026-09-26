// Probes the exact Gemini responses for the current production request shape.
require("dotenv").config({ path: require("path").join(__dirname, ".env") });

const base = "https://generativelanguage.googleapis.com/v1beta";
const key = process.env.GEMINI_API_KEY;

async function probe(label, body, model = "gemini-2.5-flash") {
  const res = await fetch(`${base}/models/${model}:generateContent?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const raw = await res.text();
  console.log(`\n=== ${label} ===`);
  console.log("status:", res.status, res.statusText);
  console.log("body:", raw.slice(0, 900));
}

(async () => {
  const bigContext = Array.from({ length: 80 }, (_, i) => `- Company: C${i}; Year: 2024; Topic: Arrays; Question: Merge intervals ${i}; Round: DSA; Role: SDE`).join("\n");

  await probe("2.5-flash maxOutputTokens 700 (CURRENT prod config)", {
    generationConfig: { temperature: 0.2, maxOutputTokens: 700 },
    contents: [{ role: "user", parts: [{ text: `${bigContext}\n\nQuestion: what does fluxon ask` }] }],
  });

  await probe("2.5-flash thinkingBudget 0 + maxOutputTokens 2048 (PROPOSED)", {
    generationConfig: { temperature: 0.2, maxOutputTokens: 2048, thinkingConfig: { thinkingBudget: 0 } },
    contents: [{ role: "user", parts: [{ text: `${bigContext}\n\nQuestion: what does fluxon ask` }] }],
  });

  // Which models/embeddings can this key actually reach?
  const listRes = await fetch(`${base}/models?key=${key}&pageSize=200`);
  const listData = await listRes.json();
  const names = (listData.models || []).map((m) => m.name).filter((n) => /flash|embedding/i.test(n));
  console.log("\n=== reachable models ===");
  console.log("status:", listRes.status);
  console.log(names.join("\n"));
})();

