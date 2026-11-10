import { useEffect, useState } from "react";
import Robot from "./Robot";

// What the bot is doing while the RAG request runs — cycles while we wait.
const STEPS = [
  "reading your question",
  "digging through seniors' interview notes",
  "picking out the useful bits",
  "writing it down neatly",
];

function BotThinking() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setStep((s) => (s + 1) % STEPS.length), 1800);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="bot-thinking" role="status" aria-live="polite">
      <div className="bot-thinking-figure">
        <span className="thought" aria-hidden="true">
          <i /><i /><i />
        </span>
        <span className="thought-trail" aria-hidden="true" />
        <Robot size={58} wave="hover" className="robot-ponder" />
      </div>
      <div>
        <p className="hand text-3xl leading-none">Crackd is thinking…</p>
        <p key={step} className="mono bot-thinking-step mt-2 text-xs muted">
          → {STEPS[step]}
        </p>
      </div>
    </div>
  );
}

export default BotThinking;
