const { answerQuestion } = require("../services/ragService");

exports.chat = async (req, res) => {
  try {
    const question = String(req.body.question || "").trim();

    if (!question) {
      return res.status(400).json({ success: false, message: "Question is required" });
    }
    if (question.length > 1000) {
      return res.status(400).json({ success: false, message: "Question is too long" });
    }

    const result = await answerQuestion(question);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    console.error("[chat] Error:", error.message);
    return res.status(500).json({ success: false, message: "Unable to answer the question" });
  }
};