const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const fetch = global.fetch || require('node-fetch');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

async function run() {
  if (!GEMINI_API_KEY) {
    console.error('No GEMINI_API_KEY in env');
    process.exit(1);
  }

  const prompt = 'Test JSON output: return {"weeklyPlan":[], "checklist":[]} as JSON only';

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;

  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 1200, responseMimeType: 'application/json' },
      }),
    });

    console.log('Status:', resp.status, resp.statusText);
    const raw = await resp.text();
    console.log('Raw length:', raw.length);
    console.log('Raw snippet:', raw.slice(0, 2000));

    try {
      const json = JSON.parse(raw);
      console.log('Parsed JSON keys:', Object.keys(json));
      console.log('Candidates length:', json?.candidates?.length);
      console.log('Sample candidate parts:', JSON.stringify(json?.candidates?.[0]?.content?.parts)?.slice(0,1000));
    } catch (e) {
      console.error('Failed to parse JSON from Gemini response:', e.message);
    }
  } catch (err) {
    console.error('Fetch error:', err.message);
  }
}

run();
