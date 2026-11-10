import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import PageShell from "../components/PageShell";
import ChecklistItem from "../components/ChecklistItem";
import ReadinessBar from "../components/ReadinessBar";
import StreakDisplay from "../components/StreakDisplay";
import CompanyLabel from "../components/CompanyLabel";
import { Empty, Loader, Notice } from "../components/Bits";

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
    <button type="button" onClick={() => navigate("/roadmap")} className="btn btn-hi">
      New roadmap
    </button>
  );

  const shell = (children, extra = {}) => (
    <PageShell
      title="Progress"
      subtitle="Your streak, your readiness, and the checklist that gets you there."
      activeTab="progress"
      actions={actions}
      {...extra}
    >
      {children}
    </PageShell>
  );

  const companySlug = tracker?.target?.companySlug || "";
  const companyLabel = companySlug
    ? companySlug
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")
    : "General Preparation";

  if (loading) return shell(<Loader label="Counting your ticks" />);

  if (error === "no_tracker") {
    return shell(
      <Empty
        title="Nothing tracked yet."
        action={<button type="button" onClick={() => navigate("/roadmap")} className="btn btn-ink">Make a roadmap →</button>}
      >
        Generate a roadmap and hit “Save to tracker” — your streak and checklist will show up here.
      </Empty>
    );
  }

  if (error) return shell(<Notice tone="error">{error}</Notice>);

  if (!tracker) return shell(<Empty title="No tracker data found." />);

  const readiness = tracker.readiness || null;
  const streak = tracker.streak || null;

  return shell(
    <div className="space-y-12">
      {streak && <StreakDisplay streak={streak} />}

      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        {readiness && <ReadinessBar readiness={readiness} />}

        <button
          type="button"
          onClick={() => navigate(`/roadmap-details/${companySlug}`)}
          className="sheet lift group p-6 text-left"
        >
          <p className="kicker">Current target</p>
          <CompanyLabel name={companyLabel} size="md" className="mt-4" />
          {tracker?.target?.role && (
            <p className="mt-3 text-sm muted">
              as <span className="font-bold text-[color:var(--ink)]">{tracker.target.role}</span>
            </p>
          )}
          <p className="mt-6 font-bold transition-transform group-hover:translate-x-1">Open full roadmap →</p>
        </button>
      </div>

      <section className="sheet sheet-pad">
        <div className="mb-3 flex items-baseline justify-between gap-4">
          <h2 className="section-title !mb-0"><span className="mono">✓</span> Study checklist</h2>
          <span className="mono text-xs muted">{tracker.checklist?.length || 0} topics · tap the box to update</span>
        </div>

        {tracker.checklist?.length === 0 ? (
          <Empty title="Checklist is empty.">Add topics from your roadmap.</Empty>
        ) : (
          <div>
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
      </section>
    </div>,
    { note: "tap the boxes. it feels good." }
  );
};

export default ProgressDashboard;
