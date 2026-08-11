import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import PageShell from "../components/PageShell";
import ChecklistItem from "../components/ChecklistItem";
import ReadinessBar from "../components/ReadinessBar";
import StreakDisplay from "../components/StreakDisplay";
import CompanyLabel from "../components/CompanyLabel";

const ProgressDashboard = () => {
  const [tracker, setTracker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get("/tracker");
        setTracker(res.data.tracker);
      } catch (err) {
        const status = err.response?.status;
        const msg = err.response?.data?.message || "Failed to load tracker";

        if (status === 404) {
          setError("no_tracker");
        } else {
          setError(msg);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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

  const actions = (
    <button
      type="button"
      onClick={() => navigate("/roadmap")}
      className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
    >
      Generate Roadmap
    </button>
  );

  const companySlug = tracker?.target?.companySlug || "";
  const companyLabel = companySlug
    ? companySlug
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")
    : "General Preparation";

  if (loading) {
    return (
      <PageShell
        title="Progress Tracker"
        subtitle="Track your placement readiness and manage your study streak."
        activeTab="progress"
        actions={actions}
      >
        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-10 text-center text-slate-300">
          Loading your progress...
        </div>
      </PageShell>
    );
  }

  if (error === "no_tracker") {
    return (
      <PageShell
        title="Progress Tracker"
        subtitle="Track your placement readiness and manage your study streak."
        activeTab="progress"
        actions={actions}
      >
        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-8 text-center text-slate-300">
          <p className="text-5xl mb-4">📋</p>
          <h2 className="text-2xl font-semibold text-white mb-2">No Tracker Found</h2>
          <p className="text-slate-400 mb-6">
            Save a roadmap to tracker first. Then your progress will appear here.
          </p>
          <button
            onClick={() => navigate("/roadmap")}
            className="rounded-full bg-slate-800 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-700 transition"
          >
            Generate a Roadmap →
          </button>
        </div>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell
        title="Progress Tracker"
        subtitle="Track your placement readiness and manage your study streak."
        activeTab="progress"
        actions={actions}
      >
        <div className="rounded-3xl border border-red-500/20 bg-rose-950/80 p-8 text-center text-rose-200">
          <p>{error}</p>
        </div>
      </PageShell>
    );
  }

  if (!tracker) {
    return (
      <PageShell
        title="Progress Tracker"
        subtitle="Track your placement readiness and manage your study streak."
        activeTab="progress"
        actions={actions}
      >
        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-8 text-center text-slate-300">
          No tracker data found.
        </div>
      </PageShell>
    );
  }

  const readiness = tracker.readiness || null;
  const streak = tracker.streak || null;

  return (
    <PageShell
      title="Progress Tracker"
      subtitle="Track your placement readiness and manage your study streak."
      activeTab="progress"
      actions={actions}
    >
      <div className="space-y-8">
        {streak && <StreakDisplay streak={streak} />}

        {readiness && <ReadinessBar readiness={readiness} />}

        <div
          onClick={() => navigate(`/roadmap-details/${companySlug}`)}
          className="cursor-pointer rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-xl transition hover:border-slate-200"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CompanyLabel name={companyLabel} className="mb-2" />
              {tracker?.target?.role && (
                <p className="text-sm text-slate-300 mt-2">
                  Role: <span className="font-semibold text-white">{tracker.target.role}</span>
                </p>
              )}
            </div>
            <div className="text-3xl text-slate-300">→</div>
          </div>
          <p className="mt-4 text-sm text-slate-400">Click to view full roadmap details</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
          <div className="mb-6 flex items-center justify-between gap-4">
            <h2 className="text-2xl font-semibold text-white">📝 Study Checklist</h2>
            <span className="text-sm text-slate-400">{tracker.checklist?.length || 0} items</span>
          </div>

          {tracker.checklist?.length === 0 ? (
            <p className="text-slate-400">Checklist is empty. Add more topics from your roadmap.</p>
          ) : (
            <div className="space-y-3">
              {tracker.checklist.map((item, index) => (
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

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate("/roadmap")}
            className="rounded-full border border-slate-700 bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition"
          >
            Generate a New Roadmap?
          </button>
        </div>
      </div>
    </PageShell>
  );
};

export default ProgressDashboard;
