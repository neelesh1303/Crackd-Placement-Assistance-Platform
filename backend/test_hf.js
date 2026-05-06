const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const HF_API_TOKEN = process.env.HF_API_TOKEN;
const HF_MODEL = process.env.HF_MODEL || "meta-llama/Llama-3.1-8B-Instruct";

async function run() {
  if (!HF_API_TOKEN) {
    console.error("No HF_API_TOKEN found in backend/.env");
    process.exit(1);
  }

  const prompt = "Return strict JSON only with schema {\"weeklyPlan\":[],\"checklist\":[]}";

  const url = "https://router.huggingface.co/v1/chat/completions";

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${HF_API_TOKEN}`,
      },
      body: JSON.stringify({
        model: HF_MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        max_tokens: 256,
      }),
    });

    const text = await response.text();
    console.log("Status:", response.status, response.statusText);
    console.log("Body snippet:", text.slice(0, 2000));
  } catch (error) {
    console.error("Hugging Face test failed:", error.message);
    process.exit(1);
  }
}

run();
