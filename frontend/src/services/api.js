import axios from "axios";

const configuredApiBase = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "");
const defaultApiBase = configuredApiBase
  ? configuredApiBase.endsWith("/api")
    ? configuredApiBase
    : `${configuredApiBase}/api`
  : import.meta.env.MODE === "development"
  ? "http://localhost:5000/api"
  : "/api";

const api = axios.create({
  baseURL: defaultApiBase, // use explicit localhost backend in dev if env is not configured
  timeout: 60000,
});

api.interceptors.request.use( //axios middleware to add Authorization header with token for every request. jab bhi koi request bheji jayegi, to ye interceptor us request ko intercept karega, aur usme Authorization header add kar dega, jisme token hoga. isse hume har request me manually token add karne ki zarurat nahi padegi.
  (config) => {
    const token = localStorage.getItem("token"); //Browser ke localStorage se JWT token le rahe ho
    if (token) {
      config.headers.Authorization = "Bearer " + token;
    }
    return config; //Modified request ko aage bhej diya
  },
  (error) => Promise.reject(error)
);

//Ye middleware check karta hai token valid hai ya nahi

export default api;

/*
1. Request start hoti hai
2. Interceptor run hota hai
3. localStorage se token uthta hai
4. Header me attach hota hai
5. Final request banti hai:

GET /api/users
Authorization: Bearer xyz123

6. Backend ko request milti hai
7. Backend token verify karta hai
8. Response bhejta hai
*/
// Streams a chat answer from POST /chat/stream (Server-Sent Events).
// Calls onDelta(text) as pieces arrive; resolves with { answer, sources }.
// Throws an Error with `.canFallback = true` when streaming isn't available,
// so the caller can retry with the plain POST /chat endpoint.
export async function streamChat(question, { onDelta, signal } = {}) {
  const token = localStorage.getItem("token");
  let response;
  try {
    response = await fetch(`${api.defaults.baseURL}/chat/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
        ...(token ? { Authorization: "Bearer " + token } : {}),
      },
      body: JSON.stringify({ question }),
      signal,
    });
  } catch (networkError) {
    const err = new Error(networkError.message || "Network error");
    err.canFallback = true;
    throw err;
  }

  const contentType = response.headers.get("content-type") || "";
  if (!response.ok || !contentType.includes("text/event-stream") || !response.body) {
    let message = "";
    try {
      message = (await response.json())?.message || "";
    } catch {
      /* not JSON */
    }
    const err = new Error(message || `Request failed (${response.status})`);
    // 400/401 are real answers from the server; anything else (e.g. 404 on an older backend) can fall back
    err.canFallback = response.status !== 400 && response.status !== 401;
    throw err;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let result = null;
  let streamError = null;

  const handleEvent = (raw) => {
    let event = "message";
    const data = [];
    raw.split("\n").forEach((line) => {
      if (line.startsWith("event:")) event = line.slice(6).trim();
      else if (line.startsWith("data:")) data.push(line.slice(5).trim());
    });
    if (!data.length) return;
    let payload;
    try {
      payload = JSON.parse(data.join("\n"));
    } catch {
      return;
    }
    if (event === "delta") onDelta?.(payload.text || "");
    else if (event === "done") result = payload;
    else if (event === "error") streamError = new Error(payload.message || "The assistant ran into a problem.");
  };

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

  if (streamError) throw streamError;
  if (!result) throw new Error("The answer was cut off. Please try again.");
  return result;
}
