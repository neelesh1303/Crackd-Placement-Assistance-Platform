const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const HF_API_TOKEN = process.env.HF_API_TOKEN;
const HF_MODEL = process.env.HF_MODEL || "meta-llama/Llama-3.1-8B-Instruct";

function safeParseAIJson(raw) {
  const text = String(raw || "").trim();
  if (!text) return null;

  const hasRoadmapShape = (obj) => {
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) return false;
    return (
      Array.isArray(obj.weeklyPlan) ||
      Array.isArray(obj.weekly_plan) ||
      Array.isArray(obj.plan) ||
      Array.isArray(obj.checklist) ||
      Array.isArray(obj.check_list) ||
      Array.isArray(obj.topics)
    );
  };

  const tryParse = (candidate) => {
    try {
      return JSON.parse(candidate);
    } catch {
      return null;
    }
  };

  const noFence = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/, "");

  const parsedDirect = tryParse(noFence);
  if (hasRoadmapShape(parsedDirect)) return parsedDirect;

  const start = noFence.indexOf("{");
  const end = noFence.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    const parsedSlice = tryParse(noFence.slice(start, end + 1));
    if (hasRoadmapShape(parsedSlice)) return parsedSlice;
  }

  const starts = [];
  for (let i = 0; i < noFence.length; i += 1) {
    if (noFence[i] === "{") starts.push(i);
  }

  for (const s of starts) {
    let depth = 0;
    let inStr = false;
    let esc = false;
    for (let i = s; i < noFence.length; i += 1) {
      const ch = noFence[i];
      if (inStr) {
        if (esc) esc = false;
        else if (ch === "\\") esc = true;
        else if (ch === '"') inStr = false;
        continue;
      }

      if (ch === '"') {
        inStr = true;
        continue;
      }
      if (ch === "{") depth += 1;
      if (ch === "}") depth -= 1;
      if (depth === 0) {
        const candidate = noFence.slice(s, i + 1);
        const parsedCandidate = tryParse(candidate);
        if (hasRoadmapShape(parsedCandidate)) return parsedCandidate;
        break;
      }
    }
  }

  if (parsedDirect) return parsedDirect;
  if (start !== -1 && end !== -1 && end > start) {
    const parsedSlice = tryParse(noFence.slice(start, end + 1));
    if (parsedSlice) return parsedSlice;
  }

  return null;
}

(async () => {
  const prompt = [
    "Generate a practical placement prep roadmap as STRICT JSON only.",
    "Do not include markdown, code fences, or explanations.",
    "Return only a single JSON object with these keys:",
    'weeklyPlan: array of objects with week (number), focus (array of 2 strings), tasks (array of 4 short strings)',
    'checklist: array of objects with topic (string), state (one of "todo", "in-progress", "done")',
    "",
    "Input:",
    "Company: General",
    "Role: SDE Intern",
    "Weeks: 8",
    "HoursPerDay: 3",
    "WeakTopics: Arrays, DP",
    "StrongTopics: OOP",
    "CompanyTopics: Graphs, Trees",
  ].join("\n");

  const response = await fetch("https://router.huggingface.co/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${HF_API_TOKEN}`,
    },
    body: JSON.stringify({
      model: HF_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 1200,
      response_format: { type: "json_object" },
    }),
  });

  const raw = await response.text();
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = null;
  }

  const content = parsed?.choices?.[0]?.message?.content || "";
  const roadmap = safeParseAIJson(content);

  let weeklyPlanRaw = roadmap?.weeklyPlan || roadmap?.weekly_plan || roadmap?.plan;
  let checklistRaw = roadmap?.checklist || roadmap?.check_list || roadmap?.topics;

  if (Array.isArray(weeklyPlanRaw) && !Array.isArray(checklistRaw)) {
    const embedded = weeklyPlanRaw.find((item) =>
      Array.isArray(item?.checklist) || Array.isArray(item?.check_list) || Array.isArray(item?.topics)
    );
    if (embedded) {
      checklistRaw = embedded.checklist || embedded.check_list || embedded.topics;
    }
  }

  const cleanedWeeklyPlan = Array.isArray(weeklyPlanRaw)
    ? weeklyPlanRaw.filter((w) => w && (w.focus || w.tasks))
    : [];
  if (!Array.isArray(checklistRaw)) {
    const fromFocus = cleanedWeeklyPlan.flatMap((w) => Array.isArray(w.focus) ? w.focus : []);
    checklistRaw = fromFocus;
  }

  console.log("HTTP:", response.status, response.statusText);
  console.log("Model:", HF_MODEL);
  console.log("Content snippet:", content.slice(0, 1200));
  console.log("Parsed roadmap keys:", roadmap ? Object.keys(roadmap) : null);
  console.log("weeklyPlan array?", Array.isArray(weeklyPlanRaw));
  console.log("checklist recovered?", Array.isArray(checklistRaw));
  console.log("weeklyPlan count:", cleanedWeeklyPlan.length);
  console.log("checklist count:", Array.isArray(checklistRaw) ? checklistRaw.length : 0);
})();
