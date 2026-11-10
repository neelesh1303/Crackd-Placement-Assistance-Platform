const { answerQuestion, answerQuestionStream } = require("../services/ragService");

function validateQuestion(req) {
  const question = String(req.body?.question || "").trim();
  if (!question) return { error: "Question is required" };
  if (question.length > 1000) return { error: "Question is too long (maximum 1000 characters)" };
  return { question };
}

function toUserMessage(error) {
  const isApiKeyError = error.message && error.message.includes("GEMINI_API_KEY");
  return isApiKeyError
    ? "AI service is currently not configured properly (GEMINI_API_KEY is missing in deployment)."
    : (error.message || "Unable to answer the question at this moment. Please try again.");
}

exports.chat = async (req, res) => {
  try {
    const { question, error } = validateQuestion(req);
    if (error) {
      return res.status(400).json({ success: false, message: error });
    }

    const result = await answerQuestion(question);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    console.error("[chat] Controller Error:", error);
    return res.status(500).json({
      success: false,
      message: toUserMessage(error),
    });
  }
};

// Server-Sent Events: streams the answer as it is generated.
// Events: "delta" { text }, "done" { answer, sources }, "error" { message }
exports.chatStream = async (req, res) => {
  const { question, error } = validateQuestion(req);
  if (error) {
    return res.status(400).json({ success: false, message: error });
  }

  res.status(200);
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // stop proxies (nginx/Render) from buffering the stream
  res.flushHeaders?.();

  let closed = false;
  res.on("close", () => {
    closed = true;
  });

  const emit = (event, data) => {
    if (closed) return;
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    await answerQuestionStream(question, emit);
  } catch (streamError) {
    console.error("[chat] Stream Error:", streamError);
    emit("error", { message: toUserMessage(streamError) });
  } finally {
    if (!closed) res.end();
  }
};
