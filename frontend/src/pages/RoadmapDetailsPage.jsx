import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import ChecklistItem from "../components/ChecklistItem";
import ReadinessBar from "../components/ReadinessBar";
import StreakDisplay from "../components/StreakDisplay";
import CompanyLabel from "../components/CompanyLabel";

const RoadmapDetailsPage = () => {
  const { companySlug } = useParams();
  const [tracker, setTracker] = useState(null);
  const [companyTopics, setCompanyTopics] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch tracker for current user
        const trackerRes = await api.get("/tracker");
        setTracker(trackerRes.data.tracker);

        // Fetch experiences for this company to get topics
        const experiencesRes = await api.get(
          `/experiences?company=${companySlug}`
        );
        
        // Extract unique topics from company's past experiences (problems asked in interviews)
        const experiences = experiencesRes.data.experiences || [];
        const topicsSet = new Set();
        
        experiences.forEach((exp) => {
          // If experience has problems or topics associated with it, add them
          if (exp.rounds && Array.isArray(exp.rounds)) {
            exp.rounds.forEach((round) => {
              if (round.problemsAsked && Array.isArray(round.problemsAsked)) {
                round.problemsAsked.forEach((problem) => {
                  if (typeof problem === "string" && problem.trim()) {
                    topicsSet.add(problem.trim());
                  }
                });
              }
              if (round.topics && Array.isArray(round.topics)) {
                round.topics.forEach((topic) => {
                  if (typeof topic === "string" && topic.trim()) {
                    topicsSet.add(topic.trim());
                  }
                });
              }
            });
          }
        });

        setCompanyTopics(topicsSet);
      } catch (err) {
        const status = err.response?.status;
        const msg = err.response?.data?.message || "Failed to load data";

        if (status === 404) {
          setError("no_tracker");
        } else {
          // If we can't fetch experiences, still show the roadmap with all topics
          // This is a fallback
          setError(null);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [companySlug]);

  const handleChecklistUpdate = async (index, newState) => {
    try {
      const response = await api.put("/tracker/checklist", {
        topicIndex: index,
        newState,
      });
      setTracker(response.data.tracker);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update checklist");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-gray-500 text-lg">Loading roadmap...</p>
      </div>
    );
  }

  if (error === "no_tracker") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 max-w-md text-center">
          <p className="text-5xl mb-4">📋</p>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            No Tracker Found 
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            Generate a Roadmap and click on "Save to Tracker" to start tracking your progress
          </p>
          <button
            onClick={() => navigate("/roadmap")}
            className="rounded-lg bg-slate-900 px-5 py-2 text-white text-sm hover:bg-slate-800 transition"
          >
            Generate a Roadmap? →
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-red-500 text-center">{error}</p>
      </div>
    );
  }

  if (!tracker) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-gray-500">Tracker data not found</p>
      </div>
    );
  }

  const readiness = tracker.readiness || null;
  const streak = tracker.streak || null;

  const companyLabel = companySlug
    ? companySlug
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")
    : "General Preparation";

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto container-glass p-8">
        
        {/* Back Button */}
        <button
          onClick={() => navigate("/progress")}
          className="mb-6 rounded-lg border border-slate-200 px-3 py-1 text-sm text-slate-600 hover:bg-slate-100 transition"
        >
          ← Back to Progress
        </button>

        {/* Header */}
        <div className="mb-2">
          <CompanyLabel name={companyLabel} size="lg" />
        </div>
        {tracker?.target?.role && (
          <p className="text-gray-600 mb-8">
            Role: <span className="font-semibold">{tracker.target.role}</span>
          </p>
        )}

        {/* Streak Section */}
        {streak && <StreakDisplay streak={streak} />}

        {/* Readiness Bar */}
        {readiness && <ReadinessBar readiness={readiness} />}

        {/* Weekly Plan Section */}
        {tracker.weeklyPlan?.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">📅 Weekly Plan</h2>
            <div className="space-y-4">
              {tracker.weeklyPlan.map((week, idx) => (
                <div key={idx} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="font-bold text-lg text-gray-800">Week {week.week}</h3>
                  {week.focus?.length > 0 && (
                    <p className="text-sm text-gray-600 mt-2">
                      Focus: {week.focus.join(", ")}
                    </p>
                  )}
                  {week.tasks?.length > 0 && (
                    <ul className="mt-3 list-disc list-inside text-sm text-gray-600 space-y-1">
                      {week.tasks.map((task, i) => (
                        <li key={i}>{task}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Checklist Section */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            📝 Study Checklist
          </h2>

          {tracker.checklist?.length === 0 ? (
            <p className="text-gray-500 text-sm">
              Checklist empty hai — roadmap me topics add karo.
            </p>
          ) : (
            <div className="space-y-3">
              {tracker.checklist
                .filter((item) => {
                  // If no company topics fetched, show all (fallback)
                  if (companyTopics.size === 0) return true;
                  // Otherwise, only show topics mentioned in this company's experiences
                  return companyTopics.has(item.topic);
                })
                .map((item, index) => (
                  <ChecklistItem
                    key={index}
                    item={item}
                    index={index}
                    onStateChange={handleChecklistUpdate}
                  />
                ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-8 pb-8 flex gap-4">
          <button
            onClick={() => navigate("/progress")}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 transition"
          >
            ← Back to Progress
          </button>
          <button
            onClick={() => navigate("/roadmap")}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800 transition"
          >
            Update Roadmap
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoadmapDetailsPage;
