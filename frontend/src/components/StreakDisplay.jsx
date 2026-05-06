import React from "react";

const StreakDisplay = ({ streak }) => {
  const { current, longest, lastActivityDate } = streak;

  const lastDate = lastActivityDate ? new Date(lastActivityDate).toLocaleDateString() : "Never"; //

  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      {/* Current Streak */}
      <div className="bg-gradient-to-br from-orange-400 to-red-500 text-white p-6 rounded-lg shadow-md">
        <div className="text-4xl font-bold mb-2">🔥 {current}</div>
        <p className="text-sm opacity-90">Current Streak</p>
        <p className="text-xs mt-2 opacity-75">Days in a row</p>
      </div>

      {/* Longest Streak */}
      <div className="bg-gradient-to-br from-purple-400 to-pink-500 text-white p-6 rounded-lg shadow-md">
        <div className="text-4xl font-bold mb-2">⭐ {longest}</div>
        <p className="text-sm opacity-90">Personal Best</p>
        <p className="text-xs mt-2 opacity-75">Longest streak</p>
      </div>

      {/* Last Activity */}
      <div className="bg-gradient-to-br from-blue-400 to-cyan-500 text-white p-6 rounded-lg shadow-md">
        <div className="text-xl font-bold mb-2">📅</div>
        <p className="text-sm opacity-90">Last Active</p>
        <p className="text-xs mt-2 opacity-75">{lastDate}</p>
      </div>
    </div>
  );
};

export default StreakDisplay;