const { answerQuestion } = require("../services/ragService");

exports.chat = async (req, res) => {
  try {
    const question = String(req.body?.question || "").trim();

    if (!question) {
      return res.status(400).json({ success: false, message: "Question is required" });
    }
    if (question.length > 1000) {
      return res.status(400).json({ success: false, message: "Question is too long (maximum 1000 characters)" });
    }

    const result = await answerQuestion(question);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    console.error("[chat] Controller Error:", error);

    const isApiKeyError = error.message && error.message.includes("GEMINI_API_KEY");
    const userMessage = isApiKeyError
      ? "AI service is currently not configured properly (GEMINI_API_KEY is missing in deployment)."
      : (error.message || "Unable to answer the question at this moment. Please try again.");

    return res.status(500).json({
      success: false,
      message: userMessage,
    });
  }
};