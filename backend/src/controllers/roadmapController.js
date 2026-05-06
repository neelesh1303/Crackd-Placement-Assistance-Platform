const Problem = require("../models/Problem");
const Company = require("../models/Company");

// HF_API_TOKEN aur HF_MODEL env file se aate hain
// Llama-3.1-8B-Instruct ke liye HuggingFace Pro access chahiye,
// isliye default model Mistral rakha hai jo free tier me bhi kaam karta hai
const HF_API_TOKEN = process.env.HF_API_TOKEN;
const HF_MODEL = process.env.HF_MODEL || "mistralai/Mistral-7B-Instruct-v0.3";

// [DEBUG] Ye lines server start hone par token aur model log karti hain
// Agar token "false" print ho raha hai to dotenv.config() check karo apne server.js/app.js me
console.log("[DEBUG] HF_API_TOKEN present:", !!HF_API_TOKEN);
console.log("[DEBUG] HF_MODEL:", HF_MODEL);

const DEFAULT_TOPICS = [
  "Arrays",
  "Strings",
  "Hashing",
  "Sliding Window",
  "Two Pointers",
  "Stack",
  "Queue",
  "Linked List",
  "Binary Search",
  "Trees",
  "Graphs",
  "Dynamic Programming",
  "Greedy",
  "LLD Basics",
  "OS DBMS CN Core",
];

// ye function input topics array se duplicate aur empty topics remove karta hai
// Set use karke case-insensitive deduplication hoti hai, aur trim se extra spaces hata diye jaate hain
function uniqueTopics(arr) {
  const seen = new Set();
  const out = [];
  for (const t of arr) {
    const v = String(t || "").trim();
    if (!v) continue;
    const key = v.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(v);
    }
  }
  return out;
}

// har week ke plan item ko safe aur consistent format me convert karta hai
// focus max 2 items aur tasks max 4 items tak limit kiye hain taaki output clean rahe
function normalizePlanItem(item) {
  return {
    week: Number(item?.week) || 1,
    focus: Array.isArray(item?.focus)
      ? item.focus.map((x) => String(x || "").trim()).filter(Boolean).slice(0, 2)
      : [],
    tasks: Array.isArray(item?.tasks)
      ? item.tasks.map((x) => String(x || "").trim()).filter(Boolean).slice(0, 4)
      : [],
  };
}

// checklist item ka state sirf allowed values me rakha jata hai
// agar model galat state deta hai to default "todo" set ho jaata hai
function normalizeChecklistItem(item) {
  return {
    topic: String(item?.topic || "").trim(),
    state: ["todo", "in-progress", "done"].includes(item?.state)
      ? item.state
      : "todo",
  };
}

// AI response me kabhi markdown fences ya extra text aa sakta hai
// ye function multiple strategies se valid JSON object extract karne ki koshish karta hai
function safeParseAIJson(raw) {
  const text = String(raw || "").trim();
  if (!text) return null;

  // valid roadmap shape check karta hai — weeklyPlan ya checklist hona chahiye
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

  // markdown code fences (```json ... ```) hata ke direct parse try karte hain
  const noFence = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/, "");

  const parsedDirect = tryParse(noFence);
  if (hasRoadmapShape(parsedDirect)) return parsedDirect;

  // puri string me pehle { aur last } ke beech ka JSON extract karke try karte hain
  const start = noFence.indexOf("{");
  const end = noFence.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    const parsedSlice = tryParse(noFence.slice(start, end + 1));
    if (hasRoadmapShape(parsedSlice)) return parsedSlice;
  }

  // model kabhi explanatory text ke beech me valid JSON object de deta hai
  // to balanced braces scan karke har possible JSON object parse try karte hain
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
        if (esc) {
          esc = false;
        } else if (ch === "\\") {
          esc = true;
        } else if (ch === '"') {
          inStr = false;
        }
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
        if (hasRoadmapShape(parsedCandidate)) {
          return parsedCandidate;
        }
        // ye object roadmap-shape ka nahi hai, next candidate try karte hain
        break;
      }
    }
  }

  // last resort: koi bhi parsable object mil jaye to return karte hain (debug ke liye)
  if (parsedDirect) return parsedDirect;
  if (start !== -1 && end !== -1 && end > start) {
    const parsedSlice = tryParse(noFence.slice(start, end + 1));
    if (parsedSlice) return parsedSlice;
  }

  return null;
}

// agar AI generation fail ho jaye to ye function basic fallback roadmap banata hai
// weakTopics, companyTopics, aur DEFAULT_TOPICS merge karke weekly plan aur checklist generate hoti hai
function buildFallbackRoadmap({ role, weeks, weakTopics, companyTopics }) {
  const merged = uniqueTopics([...weakTopics, ...companyTopics, ...DEFAULT_TOPICS]);
  const weeklyPlan = [];

  // har week ke liye merged topics list se 2 focus areas assign karte hain
  // agar topics khatam ho jaaye to "Revision" aur "Mock Practice" default use hote hain
  for (let i = 0; i < weeks; i += 1) {
    const a = merged[i * 2] || "Revision";
    const b = merged[i * 2 + 1] || "Mock Practice";
    weeklyPlan.push({
      week: i + 1,
      focus: [a, b],
      tasks: [
        "Solve 12-18 focused questions",
        "Do 1 timed test",
        "Revise mistakes and take notes",
        "Do 1 interview-style recap",
      ],
    });
  }

  // top 18 unique topics ko "todo" state ke saath checklist me convert karte hain
  const checklist = uniqueTopics(merged.slice(0, Math.min(18, merged.length))).map((topic) => ({
    topic,
    state: "todo",
  }));

  return { weeklyPlan, checklist, source: "fallback" };
}

// HuggingFace Inference API ko direct REST call se use karte hain — SDK dependency avoid hoti hai
// FIX 1: response_format hataya — Llama/Mistral models ye parameter support nahi karte,
//         isse model ya to fail ho jaata tha ya empty response deta tha → fallback trigger hota tha
// FIX 2: Free tier compatible models ka default rakha hai (Mistral-7B)
async function callHuggingFace(prompt) {
  if (!HF_API_TOKEN) {
    console.warn("[roadmap] HF_API_TOKEN missing — skipping AI call, using fallback");
    return null;
  }

  const response = await fetch(
    "https://router.huggingface.co/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${HF_API_TOKEN}`,
      },
      body: JSON.stringify({
        model: HF_MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,   // low temperature se consistent JSON output milta hai
        max_tokens: 1200,
        // FIX: response_format HATAYA — ye sirf OpenAI ke specific models support karte hain
        // Llama/Mistral pe ye parameter error ya empty response cause karta tha
        // JSON enforce karne ke liye ab prompt me hi instruction di gayi hai
      }),
    }
  );

  if (!response.ok) {
    // HF API failure ka exact reason log karte hain taaki root cause samajh aaye
    // 401 = token galat, 403 = model access nahi, 404 = model exist nahi
    console.error(`[roadmap] Hugging Face API error: ${response.status} ${response.statusText}`);
    const errText = await response.text().catch(() => "");
    console.error(`[roadmap] Hugging Face error body: ${errText.slice(0, 2000)}`);
    throw new Error(`Hugging Face API error ${response.status}`);
  }

  const data = await response.json().catch((err) => {
    console.error(`[roadmap] Failed to parse Hugging Face JSON response: ${err.message}`);
    return null;
  });

  if (data) {
    try {
      console.debug(`[roadmap] Hugging Face raw response: ${JSON.stringify(data).slice(0, 2000)}`);
    } catch (e) {
      // stringify fail hone par silently ignore karo
    }
  }

  // chat-completions response structure se assistant ka text content nikalte hain
  let text = null;
  if (typeof data?.choices?.[0]?.message?.content === "string") {
    text = data.choices[0].message.content.trim();
  }

  if (!text) {
    console.warn("[roadmap] Hugging Face returned empty text content");
  } else {
    console.debug(`[roadmap] Hugging Face text snippet: ${text.slice(0, 2000)}`);
  }

  return text || null;
}

// AI se roadmap generate karne ki koshish karta hai
// FIX 3: Prompt me ab strict JSON-only instructions add ki hain
// Llama/Mistral ke liye yahi tarika kaam karta hai kyunki response_format support nahi hota
async function tryAIGeneration({ companyName, role, weeks, hoursPerDay, weakTopics, strongTopics, companyTopics }) {
  if (!HF_API_TOKEN) return null;

  // Prompt sirf weeklyPlan ke liye: checklist DEFAULT_TOPICS se automatically banti hai
  // Ye AI ka load kam karta hai aur consistent checklist ensure karta hai
  const prompt = [
    "You are a placement preparation assistant.",
    "Generate a practical placement prep roadmap as STRICT JSON only.",
    "Do NOT include markdown, code fences, backticks, or any explanation.",
    "Your response must start with { and end with }. Nothing before or after.",
    "Return only a single JSON object with exactly ONE key:",
    "  weeklyPlan: array of objects, each with:",
    "    week (number), focus (array of exactly 2 strings), tasks (array of exactly 4 short strings)",
    "",
    "Input parameters:",
    "Company: " + (companyName || "General"),
    "Role: " + role,
    "Weeks: " + weeks,
    "HoursPerDay: " + hoursPerDay,
    "WeakTopics: " + (weakTopics.length ? weakTopics.join(", ") : "None"),
    "StrongTopics: " + (strongTopics.length ? strongTopics.join(", ") : "None"),
    "CompanyTopics: " + (companyTopics.length ? companyTopics.join(", ") : "None"),
    "",
    "Remember: Respond with ONLY the JSON object containing weeklyPlan. No text before or after.",
  ].join("\n");

  const text = await callHuggingFace(prompt);
  const parsed = safeParseAIJson(text);
  if (!parsed) {
    console.warn("[roadmap] AI response parse nahi hua — fallback use hoga");
    return null;
  }

  // model different key names use kar sakta hai, saare common variants handle karte hain
  let weeklyPlanRaw = parsed.weeklyPlan || parsed.weekly_plan || parsed.plan;

  // Checklist ke liye AI ke output ko ignore karte hain — hum DEFAULT_TOPICS use karenge
  // Sirf weeklyPlan AI se lenge, kyunki vo user ke specific weeks aur focus areas ke hisab se hota hai
  if (!Array.isArray(weeklyPlanRaw)) {
    console.warn("[roadmap] weeklyPlan array nahi mili AI response me");
    return null;
  }

  // weekly plan items normalize karte hain aur empty items filter karte hain
  let cleanedWeeklyPlan = weeklyPlanRaw
    .map(normalizePlanItem)
    .filter((w) => w.focus.length > 0 || w.tasks.length > 0);

  // Checklist hamesha DEFAULT_TOPICS se banate hain, AI ke generated topics nahi
  // Weak aur company topics ko prioritize karte hain, baaki DEFAULT_TOPICS se fill karte hain
  const priorityTopics = uniqueTopics([
    ...weakTopics,
    ...companyTopics,
    ...(cleanedWeeklyPlan.flatMap((w) => w.focus || []) || []),
  ]);

  // Sabhi unique topics collect karte hain: priority + remaining DEFAULT_TOPICS
  const allTopics = uniqueTopics([
    ...priorityTopics,
    ...DEFAULT_TOPICS,
  ]);

  // Top 18 unique topics ko checklist banate hain
  const cleanedChecklist = allTopics.slice(0, 18).map((topic) => ({
    topic,
    state: "todo",
  }));

  // agar weeklyPlan corrupt hai lekin checklist theek hai to fallback se weekly plan banate hain
  if (!cleanedWeeklyPlan.length && cleanedChecklist.length) {
    console.warn("[roadmap] weeklyPlan empty tha, fallback weekly plan use ho raha hai");
    cleanedWeeklyPlan = buildFallbackRoadmap({
      role,
      weeks,
      weakTopics,
      companyTopics,
    }).weeklyPlan;
  }

  if (!cleanedWeeklyPlan.length || !cleanedChecklist.length) {
    console.warn("[roadmap] Clean plan empty hai — full fallback trigger hoga");
    return null;
  }

  return {
    weeklyPlan: cleanedWeeklyPlan,
    checklist: cleanedChecklist,
    source: "huggingface",
  };
}

// Main controller: user ke input se roadmap generate karta hai
// Pehle AI se try karta hai, fail hone par fallback roadmap return karta hai
exports.generateRoadmap = async (req, res) => {
  try {
    // req.body se input parameters extract karte hain, default values set hain agar kuch missing ho
    const {
      companySlug = "",
      role = "SDE Intern",
      weeks = 8,
      hoursPerDay = 3,
      weakTopics = [],
      strongTopics = [],
    } = req.body;

    // weeks ko 2-24 ke beech clamp karte hain taaki unrealistic values na aaye
    const safeWeeks = Math.max(2, Math.min(Number(weeks) || 8, 24));

    // hoursPerDay ko 1-12 ke beech clamp karte hain
    const safeHours = Math.max(1, Math.min(Number(hoursPerDay) || 3, 12));

    // weakTopics aur strongTopics arrays ko sanitize karke unique topics nikalte hain
    const weak = uniqueTopics(Array.isArray(weakTopics) ? weakTopics : []);
    const strong = uniqueTopics(Array.isArray(strongTopics) ? strongTopics : []);

    // agar companySlug diya gaya hai to database me company dhundte hain
    let company = null;
    if (companySlug) {
      company = await Company.findOne({ slug: String(companySlug).toLowerCase() });
    }

    // company ke problems se commonly asked topics extract karte hain AI input ke liye
    let companyTopics = [];
    if (company) {
      const docs = await Problem.find({ company: company._id }).select("topic");
      companyTopics = uniqueTopics(docs.map((d) => d.topic));
    }

    // pehle AI se roadmap generate karne ki koshish karte hain
    let aiResult = null;
    try {
      aiResult = await tryAIGeneration({
        companyName: company?.name || "",
        role,
        weeks: safeWeeks,
        hoursPerDay: safeHours,
        weakTopics: weak,
        strongTopics: strong,
        companyTopics,
      });
    } catch (aiError) {
      // AI call fail ho gaya (network error, API error, etc.) — fallback use hoga
      console.error("[roadmap] AI generation threw an error:", aiError.message);
    }

    // agar AI result nahi mila to fallback roadmap use karte hain
    const finalPlan =
      aiResult ||
      buildFallbackRoadmap({
        role,
        weeks: safeWeeks,
        weakTopics: weak,
        companyTopics,
      });

    console.log(`[roadmap] Final plan source: ${finalPlan.source}`);

    return res.status(200).json({
      success: true,
      roadmap: {
        meta: {
          company: company?.name || "General",
          companySlug: company?.slug || "",
          role,
          weeks: safeWeeks,
          hoursPerDay: safeHours,
        },
        source: finalPlan.source,   // "huggingface" ya "fallback" — debug ke liye useful
        weeklyPlan: finalPlan.weeklyPlan,
        checklist: finalPlan.checklist,
      },
    });
  } catch (error) {
    console.error("[roadmap] Unexpected error in generateRoadmap:", error.message);
    return res.status(500).json({ message: error.message });
  }
};