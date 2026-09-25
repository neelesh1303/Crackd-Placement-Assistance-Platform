import { useState } from "react";
import PageShell from "../components/PageShell";
import api from "../services/api";

function Chat() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion || loading) return;

    setLoading(true);
    setError("");
    try {
      const response = await api.post("/chat", { question: trimmedQuestion });
      setAnswer(response.data.answer || "No answer was returned.");
      setSources(response.data.sources || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Could not reach the assistant.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageShell
      title="Prep assistant"
      subtitle="Ask questions about interview preparation and get answers grounded in Crackd's study notes."
      activeTab="chat"
    >
      <div className="mx-auto grid max-w-4xl gap-6">
        <form onSubmit={handleSubmit} className="chat-composer p-5">
          <label htmlFor="chat-question" className="chat-field-label mb-2 block">
            Your question
          </label>
          <textarea
            id="chat-question"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="How should I prepare binary search for interviews?"
            rows={4}
            maxLength={1000}
            className="resize-y p-4"
          />
          <div className="mt-4 flex items-center justify-between gap-4">
            <span className="chat-counter">{question.length}/1000</span>
            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="chat-submit px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Thinking..." : "Ask assistant"}
            </button>
          </div>
        </form>

        {error && <p className="chat-error p-4 text-sm">{error}</p>}

        {answer && (
          <section className="chat-answer p-6">
            <p className="chat-section-label mb-4">Answer</p>
            <p className="chat-answer-text whitespace-pre-wrap">{answer}</p>
            {sources.length > 0 && (
              <div className="chat-sources mt-6 pt-5">
                <p className="chat-section-label mb-3">Retrieved context</p>
                <div className="flex flex-wrap gap-2">
                  {sources.map((source) => (
                    <span key={`${source.source}-${source.score}-${source.title}`} className="chat-source px-3 py-2 text-xs">
                      {source.title}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </PageShell>
  );
}

export default Chat;