//is file mein ReadinessBar component define kiya gaya hai, jo ki user ke placement preparation ke readiness ko visually represent karta hai. is component me percentage, completedTopics, aur totalTopics props liye jate hain, jo user ke progress ko calculate karne ke liye use hote hain. progress bar ka color percentage ke basis par change hota hai, aur milestone messages bhi display hote hain jo user ko motivate karte hain. ye component user ko unke placement preparation ke progress ko easily samajhne me madad karta hai, aur unhe encourage karta hai ki wo apne goals achieve karne ke liye consistent efforts karein.

import React from "react";

const ReadinessBar = ({ readiness }) => { // ReadinessBar component ko define karta hai, jo ki user ke placement preparation ke readiness ko visually represent karta hai. is component me percentage, completedTopics, aur totalTopics props liye jate hain, jo user ke progress ko calculate karne ke liye use hote hain. progress bar ka color percentage ke basis par change hota hai, aur milestone messages bhi display hote hain jo user ko motivate karte hain. ye component user ko unke placement preparation ke progress ko easily samajhne me madad karta hai, aur unhe encourage karta hai ki wo apne goals achieve karne ke liye consistent efforts karein.
  const { percentage, completedTopics, totalTopics } = readiness;

  // Color based on percentage
  let barColor = "bg-red-500";
  if (percentage >= 50) barColor = "bg-yellow-500";
  if (percentage >= 75) barColor = "bg-blue-500";
  if (percentage >= 90) barColor = "bg-green-500";

  return (
    <div className="w-full bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-bold text-gray-800">📊 Placement Readiness</h3>
        <span className="text-2xl font-bold text-gray-900">{percentage}%</span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-300 rounded-full h-4 overflow-hidden">
        <div
          className={`${barColor} h-full transition-all duration-300`}
          style={{ width: `${percentage}%` }} //progress bar ke width ko percentage ke basis par set kiya gaya hai, taki ye visually represent kare ki user kitna ready hai. jab percentage badhta hai to bar ka width bhi badhta hai, aur color bhi change hota hai based on the defined thresholds.
        ></div>
      </div>

      {/* Stats */}
      <div className="flex justify-between mt-3 text-sm text-gray-600">
        <span>
          ✓ {completedTopics} / {totalTopics} topics
        </span>
        <span>{totalTopics - completedTopics} remaining</span>
      </div>

      {/* Milestone messages */}
      <div className="mt-4 text-sm">
        {percentage < 50 && (
          <p className="text-red-600 font-semibold">🔥 Keep working! You're just starting.</p>
        )}
        {percentage >= 50 && percentage < 75 && (
          <p className="text-yellow-600 font-semibold">💪 Great progress! Halfway there.</p>
        )}
        {percentage >= 75 && percentage < 90 && (
          <p className="text-blue-600 font-semibold">🚀 Almost ready! Final push needed.</p>
        )}
        {percentage >= 90 && (
          <p className="text-green-600 font-semibold">🎉 You're interview-ready!</p>
        )}
      </div>
    </div>
  );
};

export default ReadinessBar;