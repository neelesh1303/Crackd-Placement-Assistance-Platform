//ReadinessBar user ke placement preparation ki readiness ko ek pencil-shaded meter ke roop me dikhata hai. percentage ke basis par fill ka color aur ek handwritten note change hota hai.

import React from "react";

const noteFor = (percentage) => {
  if (percentage >= 90) return { text: "You're interview-ready. Go get it.", tone: "text-[color:var(--green)]" };
  if (percentage >= 75) return { text: "Almost there — one last push.", tone: "text-[color:var(--blue)]" };
  if (percentage >= 50) return { text: "Halfway. The hard part is behind you.", tone: "text-[color:var(--ink)]" };
  return { text: "Just getting started. That's fine.", tone: "text-[color:var(--red)]" };
};

const ReadinessBar = ({ readiness }) => {
  const { percentage, completedTopics, totalTopics } = readiness;
  const note = noteFor(percentage);
  const fillClass = percentage >= 75 ? "is-high" : percentage < 50 ? "is-low" : "";

  return (
    <section className="sheet sheet-pad rise">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="kicker">Placement readiness</p>
          <p className={`hand mt-2 text-2xl ${note.tone}`}>{note.text}</p>
        </div>
        <p className="stat-num">
          {percentage}
          <span className="serif text-4xl italic">%</span>
        </p>
      </div>

      <div className="meter mt-5" role="progressbar" aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100}>
        <div className={`meter-fill ${fillClass}`} style={{ width: `${percentage}%` }} />
      </div>

      <div className="mono mt-3 flex justify-between text-xs muted">
        <span>{completedTopics} / {totalTopics} topics done</span>
        <span>{totalTopics - completedTopics} left</span>
      </div>
    </section>
  );
};

export default ReadinessBar;
