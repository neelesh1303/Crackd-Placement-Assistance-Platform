import { useState } from "react";
import PageShell from "../components/PageShell";
import api from "../services/api";
import { Loader, Notice } from "../components/Bits";

const STARTERS = [
  "How should I prepare binary search for interviews?",
  "What do companies usually ask in the OA round?",
  "Which DP problems come up most often?",
];

function Chat() {
  const [question, setQuestion] = useState("");
  const [asked, setAsked] = useState("");
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
    setAsked(trimmedQuestion);
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
      title={<>Got a doubt? <span className="serif italic">Ask Crackd.</span></>}
      subtitle="Your prep buddy that has read every interview story on Crackd. Ask the thing you were too shy to ask in class."
      activeTab="chat"
    >
      <div className="mx-auto grid max-w-3xl gap-8">
        <form onSubmit={handleSubmit} className="sheet taped sheet-pad">
          <label htmlFor="chat-question" className="field-label">Your question</label>
          <textarea
            id="chat-question"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) handleSubmit(event);
            }}
            placeholder="How should I prepare binary search for interviews?"
            rows={4}
            maxLength={1000}
            className="field text-lg"
          />

          {!question && (
            <div className="mt-4 flex flex-wrap gap-2">
              {STARTERS.map((starter) => (
                <button key={starter} type="button" onClick={() => setQuestion(starter)} className="chip">
                  {starter}
                </button>
              ))}
            </div>
          )}

          <div className="mt-5 flex items-center justify-between gap-4">
            <span className="mono text-xs faint">{question.length}/1000 · ctrl+enter to send</span>
            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="btn btn-ink"
            >
              {loading ? "Thinking…" : <>Ask <span className="arrow">→</span></>}
            </button>
          </div>
        </form>

        {loading && <Loader label="Flipping through the notes" />}
        {error && <Notice tone="error">{error}</Notice>}

        {answer && !loading && (
          <section className="sheet sheet-pad rise">
            {asked && (
              <p className="hand mb-5 text-2xl text-[color:var(--blue)]">Q: {asked}</p>
            )}
            <p className="kicker mb-3"><b>A.</b> answer</p>
            <p className="prose-note">{answer}</p>
            {sources.length > 0 && (
              <div className="mt-8 border-t border-dashed border-[color:var(--ink-3)] pt-5">
                <p className="kicker mb-3">Sources it read</p>
                <div className="flex flex-wrap gap-2">
                  {sources.map((source) => (
                    <span key={`${source.source}-${source.score}-${source.title}`} className="tag tag-sq">
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
