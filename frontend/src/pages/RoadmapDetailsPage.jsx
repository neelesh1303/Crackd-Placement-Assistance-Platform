import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import ChecklistItem from "../components/ChecklistItem";
import ReadinessBar from "../components/ReadinessBar";
import StreakDisplay from "../components/StreakDisplay";
import CompanyLabel from "../components/CompanyLabel";
import PageShell from "../components/PageShell";

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
      <PageShell title="Roadmap details" subtitle="Loading your saved preparation plan." activeTab="progress">
        <p className="roadmap-status">Loading roadmap...</p>
      </PageShell>
    );
  }

  if (error === "no_tracker") {
    return (
      <PageShell title="Roadmap details" subtitle="Save a roadmap to see your progress here." activeTab="progress">
        <div className="roadmap-empty mx-auto max-w-md p-8 text-center">
          <p className="text-5xl mb-4">📋</p>
          <h2 className="text-xl font-bold text-slate-100 mb-2">
            No Tracker Found 
          </h2>
          <p className="text-slate-300 text-sm mb-6">
            Generate a Roadmap and click on "Save to Tracker" to start tracking your progress
          </p>
          <button
            onClick={() => navigate("/roadmap")}
            className="rounded-lg bg-slate-900 px-5 py-2 text-white text-sm hover:bg-slate-800 transition"
          >
            Generate a Roadmap? →
          </button>
        </div>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell title="Roadmap details" subtitle="There was a problem loading this plan." activeTab="progress">
        <p className="roadmap-status roadmap-status-error">{error}</p>
      </PageShell>
    );
  }

  if (!tracker) {
    return (
      <PageShell title="Roadmap details" subtitle="No saved tracker data was found." activeTab="progress">
        <p className="roadmap-status">Tracker data not found</p>
      </PageShell>
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
    <PageShell
      title={`${companyLabel} roadmap`}
      subtitle="Review your weekly plan and keep your preparation moving."
      activeTab="progress"
      actions={
        <button
          onClick={() => navigate("/progress")}
          className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
        >
          Back to Progress
        </button>
      }
    >
      <div className="roadmap-details-content mx-auto max-w-4xl">
        
        {/* Header */}
        <div className="mb-2">
          <CompanyLabel name={companyLabel} size="lg" />
        </div>
        {tracker?.target?.role && (
              <p className="text-slate-300 mb-8">
            Role: <span className="font-semibold text-slate-100">{tracker.target.role}</span>
          </p>
        )}

        {/* Streak Section */}
        {streak && <StreakDisplay streak={streak} />}

        {/* Readiness Bar */}
        {readiness && <ReadinessBar readiness={readiness} />}

        {/* Weekly Plan Section */}
        {tracker.weeklyPlan?.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-slate-100 mb-4">📅 Weekly Plan</h2>
            <div className="space-y-4">
              {tracker.weeklyPlan.map((week, idx) => (
                <div key={idx} className="roadmap-week p-5">
                  <h3 className="font-bold text-lg text-slate-100">Week {week.week}</h3>
                  {week.focus?.length > 0 && (
                    <p className="text-sm text-slate-300 mt-2">
                      Focus: {week.focus.join(", ")}
                    </p>
                  )}
                  {week.tasks?.length > 0 && (
                    <ul className="mt-3 list-disc list-inside text-sm text-slate-300 space-y-1">
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
          <h2 className="text-2xl font-bold text-slate-100 mb-4">
            📝 Study Checklist
          </h2>

          {tracker.checklist?.length === 0 ? (
            <p className="text-slate-400 text-sm">
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
            className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-200 hover:bg-white/10 transition"
          >
            ← Back to Progress
          </button>
          <button
            onClick={() => navigate("/roadmap")}
            className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400 transition"
          >
            Update Roadmap
          </button>
        </div>
      </div>
    </PageShell>
  );
};

export default RoadmapDetailsPage;
