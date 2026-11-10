import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import ChecklistItem from "../components/ChecklistItem";
import ReadinessBar from "../components/ReadinessBar";
import StreakDisplay from "../components/StreakDisplay";
import PageShell from "../components/PageShell";
import { Empty, Loader, Notice } from "../components/Bits";

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

  const companyLabel = companySlug
    ? companySlug
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")
    : "General Preparation";

  const backButton = (
    <button type="button" onClick={() => navigate("/progress")} className="btn">
      ← Progress
    </button>
  );

  if (loading) {
    return (
      <PageShell title="Roadmap" activeTab="progress">
        <Loader label="Unfolding the plan" />
      </PageShell>
    );
  }

  if (error === "no_tracker") {
    return (
      <PageShell title="Roadmap" activeTab="progress" actions={backButton}>
        <Empty
          title="No roadmap saved yet."
          action={<button type="button" onClick={() => navigate("/roadmap")} className="btn btn-ink">Make a roadmap →</button>}
        >
          Generate a roadmap and click “Save to tracker” to start tracking it.
        </Empty>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell title="Roadmap" activeTab="progress" actions={backButton}>
        <Notice tone="error">{error}</Notice>
      </PageShell>
    );
  }

  if (!tracker) {
    return (
      <PageShell title="Roadmap" activeTab="progress" actions={backButton}>
        <Empty title="Tracker data not found." />
      </PageShell>
    );
  }

  const readiness = tracker.readiness || null;
  const streak = tracker.streak || null;

  // original index saath rakhte hain taaki filter ke baad bhi sahi topic update ho
  const visibleChecklist = (tracker.checklist || [])
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => {
      // If no company topics fetched, show all (fallback)
      if (companyTopics.size === 0) return true;
      // Otherwise, only show topics mentioned in this company's experiences
      return companyTopics.has(item.topic);
    });

  return (
    <PageShell
      title={<>{companyLabel} <span className="serif italic">roadmap</span></>}
      subtitle={
        tracker?.target?.role
          ? `Your saved plan for ${tracker.target.role}. One week at a time.`
          : "Your saved plan. One week at a time."
      }
      activeTab="progress"
      actions={
        <>
          {backButton}
          <button type="button" onClick={() => navigate("/roadmap")} className="btn btn-hi">
            Update roadmap
          </button>
        </>
      }
    >
      <div className="space-y-12">
        {streak && <StreakDisplay streak={streak} />}

        {readiness && <ReadinessBar readiness={readiness} />}

        <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr]">
          {/* Weekly plan */}
          {tracker.weeklyPlan?.length > 0 && (
            <section>
              <h2 className="section-title"><span className="mono">wk</span> Weekly plan</h2>
              <ol className="m-0 list-none space-y-5 p-0">
                {tracker.weeklyPlan.map((week, idx) => (
                  <li key={idx} className="sheet sheet-pad rise" style={{ "--i": idx % 8 }}>
                    <div className="flex items-baseline gap-4">
                      <span className="mono text-sm text-[color:var(--red)]">{String(week.week).padStart(2, "0")}</span>
                      <h3 className="text-xl font-extrabold">Week {week.week}</h3>
                    </div>
                    {week.focus?.length > 0 && (
                      <p className="mt-3 text-sm"><span className="hl font-semibold">{week.focus.join(" + ")}</span></p>
                    )}
                    {week.tasks?.length > 0 && (
                      <ul className="mt-3 list-none space-y-1.5 p-0 text-sm">
                        {week.tasks.map((task, i) => (
                          <li key={i} className="flex gap-2">
                            <span className="text-[color:var(--red)]">—</span>
                            <span>{task}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ol>
            </section>
          )}

          {/* Checklist */}
          <section className="lg:sticky lg:top-24 lg:self-start">
            <h2 className="section-title"><span className="mono">✓</span> Checklist</h2>
            <div className="sheet sheet-pad">
              {visibleChecklist.length === 0 ? (
                <p className="muted text-sm">Checklist is empty — add topics from your roadmap.</p>
              ) : (
                visibleChecklist.map(({ item, index }) => (
                  <ChecklistItem
                    key={index}
                    item={item}
                    index={index}
                    onStateChange={handleChecklistUpdate}
                  />
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </PageShell>
  );
};

export default RoadmapDetailsPage;
