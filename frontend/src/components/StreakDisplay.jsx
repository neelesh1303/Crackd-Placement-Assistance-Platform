import React from "react";

const StreakDisplay = ({ streak }) => {
  const { current, longest, lastActivityDate } = streak;

  const lastDate = lastActivityDate
    ? new Date(lastActivityDate).toLocaleDateString(undefined, { day: "numeric", month: "short" })
    : "never";

  return (
    <div className="grid grid-cols-1 gap-6 pt-2 sm:grid-cols-3">
      <div className="postit rise" style={{ "--i": 0 }}>
        <p className="kicker">Current streak</p>
        <p className="stat-num mt-3">{current}</p>
        <p className="hand mt-1 text-xl">days in a row — don't break it</p>
      </div>

      <div className="postit postit-pink rise" style={{ "--i": 1 }}>
        <p className="kicker">Personal best</p>
        <p className="stat-num mt-3">{longest}</p>
        <p className="hand mt-1 text-xl">longest run so far</p>
      </div>

      <div className="postit postit-green rise" style={{ "--i": 2 }}>
        <p className="kicker">Last opened the books</p>
        <p className="mt-3 text-4xl font-extrabold tracking-tight">{lastDate}</p>
        <p className="hand mt-2 text-xl">keep showing up</p>
      </div>
    </div>
  );
};

export default StreakDisplay;
