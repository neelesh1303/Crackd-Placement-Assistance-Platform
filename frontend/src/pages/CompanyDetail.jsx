import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import PageShell from "../components/PageShell";
import CompanyLabel from "../components/CompanyLabel";

function CompanyDetail() {
  const { slug } = useParams();

  const [company, setCompany] = useState(null);
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError("");

        // Fetch company details
        const companyRes = await api.get("/companies/" + slug);

        setCompany(companyRes.data.company || null);

        // Fetch experiences for this company
        const expRes = await api.get(
          "/experiences?company=" + encodeURIComponent(slug)
        );

        setExperiences(expRes.data.experiences || []);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Failed to load company details"
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [slug]);

  // Prepare roadmap for this company
  const handlePrepare = () => {
    const allTopics = experiences.flatMap((experience) =>
      Array.isArray(experience.rounds)
        ? experience.rounds.flatMap(
            (round) => round.topics || []
          )
        : []
    );

    const freq = {};

    allTopics.forEach((topic) => {
      if (!topic) return;

      freq[topic] = (freq[topic] || 0) + 1;
    });

    const sortedTopics = Object.keys(freq).sort(
      (a, b) => freq[b] - freq[a]
    );

    const topTopics = sortedTopics.slice(0, 12);

    navigate("/roadmap", {
      state: {
        companySlug: slug,
        weakTopics: topTopics,
      },
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 px-4 py-8">
        <div className="mx-auto max-w-5xl text-slate-300">
          Loading company details...
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 px-4 py-8">
        <div className="mx-auto max-w-5xl">
          <p className="mb-4 rounded-lg bg-red-950/50 border border-red-500/30 p-3 text-red-300">
            {error}
          </p>

          <Link
            to="/companies"
            className="text-sm font-medium text-cyan-400 underline hover:text-cyan-300"
          >
            Back to companies
          </Link>
        </div>
      </div>
    );
  }

  // Company not found
  if (!company) {
    return (
      <PageShell
        title="Company Details"
        subtitle="Review interview experiences and prepare for this company."
        activeTab="companies"
      >
        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-8 text-slate-300">
          <p className="mb-4 text-slate-100">
            Company not found.
          </p>

          <Link
            to="/companies"
            className="text-sm font-medium text-cyan-400 underline hover:text-cyan-300"
          >
            Back to companies
          </Link>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title={company.name || "Company Details"}
      subtitle="Review interview experiences and company round details."
      activeTab="companies"
      actions={
        <Link
          to="/companies"
          className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
        >
          Back to Companies
        </Link>
      }
    >
      <div className="space-y-8">

        {/* ================= COMPANY HEADER ================= */}
        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-lg">

          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

            {/* Company information */}
            <div>
              <CompanyLabel
                company={company}
                size="lg"
              />

              <p className="mt-3 text-sm text-slate-300">
                Visit:{" "}
                <span className="font-semibold text-white">
                  {company.visitMonth || "N/A"}
                  {company.visitYear
                    ? ` ${company.visitYear}`
                    : ""}
                </span>
              </p>
            </div>

            {/* Difficulty */}
            <span
              className={
                "w-fit rounded-full px-3 py-1 text-xs font-semibold " +
                (company.difficulty === "Hard"
                  ? "bg-rose-100 text-rose-700"
                  : company.difficulty === "Medium"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-emerald-100 text-emerald-700")
              }
            >
              {company.difficulty || "Unknown"}
            </span>
          </div>

          {/* Roles */}
          <div className="flex flex-wrap gap-2">
            {(company.roles || []).map((role) => (
              <span
                key={role}
                className="rounded-md border border-white/10 bg-slate-800 px-3 py-1 text-xs text-slate-200"
              >
                {role}
              </span>
            ))}
          </div>

          {/* Prepare button */}
          <div className="mt-6">
            <button
              onClick={handlePrepare}
              className="rounded-full bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
            >
              Prepare for this company
            </button>
          </div>
        </div>

        {/* ================= EXPERIENCES ================= */}

        <div>
          <h2 className="mb-4 text-xl font-semibold text-white">
            Experiences
          </h2>

          {/* No experiences */}
          {experiences.length === 0 && (
            <div className="rounded-xl border border-white/10 bg-slate-900/80 p-5 text-slate-300">
              No experiences yet for this company.
            </div>
          )}

          {/* Experience cards */}
          <div className="space-y-6">
            {experiences.map((exp) => (
              <div key={exp._id} className="exp-card">
                {/* Experience header badges */}
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-xs font-semibold text-teal-300">
                      <span>💼</span> {exp.role || "Role Unspecified"}
                    </span>

                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-xs font-medium text-sky-300">
                      <span>📅</span> Year: {exp.year || exp.visitYear || "N/A"}
                    </span>

                    {exp.ctc && (
                      <span className="inline-flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-300">
                        <span>💰</span> {exp.ctc} LPA
                      </span>
                    )}

                    {exp.cgpaCutoff && (
                      <span className="inline-flex items-center gap-1 rounded-lg border border-purple-500/30 bg-purple-500/10 px-2.5 py-1 text-xs font-medium text-purple-300">
                        <span>🎯</span> CGPA {exp.cgpaCutoff}+
                      </span>
                    )}
                  </div>

                  <div>
                    {exp.gotOffer ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3.5 py-1 text-xs font-bold text-emerald-300">
                        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                        Offer Accepted 🎉
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-600 bg-slate-800/80 px-3 py-1 text-xs font-medium text-slate-300">
                        Interview Candidate
                      </span>
                    )}
                  </div>
                </div>

                {/* Rounds */}
                {Array.isArray(exp.rounds) && exp.rounds.length > 0 && (
                  <div className="mb-4">
                    <h3 className="mb-3.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-400">
                      <span>⚡</span> Interview Rounds ({exp.rounds.length})
                    </h3>

                    <div className="space-y-3.5">
                      {exp.rounds.map((round, idx) => {
                        const roundType = String(round.type || "Interview").toUpperCase();
                        let badgeStyle = "border-sky-500/30 bg-sky-500/15 text-sky-300";
                        if (roundType.includes("OA")) badgeStyle = "border-cyan-500/40 bg-cyan-500/15 text-cyan-300";
                        else if (roundType.includes("TECH") || roundType.includes("DSA")) badgeStyle = "border-emerald-500/40 bg-emerald-500/15 text-emerald-300";
                        else if (roundType.includes("HR") || roundType.includes("MANAGE")) badgeStyle = "border-amber-500/40 bg-amber-500/15 text-amber-300";
                        else if (roundType.includes("LLD") || roundType.includes("SYSTEM")) badgeStyle = "border-purple-500/40 bg-purple-500/15 text-purple-300";

                        return (
                          <div key={idx} className="exp-round-card">
                            {/* Round Header */}
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2.5 mb-3">
                              <div className="flex items-center gap-2.5">
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-slate-200">
                                  {round.roundNo || idx + 1}
                                </span>
                                <span className={`rounded-md border px-2.5 py-0.5 text-xs font-bold tracking-wide ${badgeStyle}`}>
                                  {round.type || "Interview Round"}
                                </span>
                              </div>

                              {round.duration && (
                                <span className="text-xs text-slate-400 flex items-center gap-1">
                                  <span>⏱️</span> {round.duration}
                                </span>
                              )}
                            </div>

                            {/* Description */}
                            {round.description && (
                              <p className="mb-3 text-sm leading-relaxed text-slate-200 whitespace-pre-line">
                                {round.description}
                              </p>
                            )}

                            {/* Topics Covered */}
                            {Array.isArray(round.topics) && round.topics.length > 0 && (
                              <div className="mb-3 flex flex-wrap items-center gap-1.5">
                                <span className="text-xs font-medium text-slate-400 mr-1">Topics:</span>
                                {round.topics.map((topic, tIdx) => (
                                  <span key={tIdx} className="exp-topic-chip">
                                    #{topic}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Problems Asked */}
                            {Array.isArray(round.problemsAsked) && round.problemsAsked.length > 0 && (
                              <div className="mt-2.5 rounded-lg bg-black/30 border border-white/5 p-3">
                                <p className="mb-2 text-xs font-semibold text-teal-300 flex items-center gap-1.5">
                                  <span>💻</span> Coding Problems Asked:
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {round.problemsAsked.map((problem, pIdx) => (
                                    <span key={pIdx} className="exp-problem-chip">
                                      <span className="text-cyan-400 opacity-75 font-bold">⟨/⟩</span>
                                      {problem}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Tips & Resources Footer */}
                {(exp.tips || (Array.isArray(exp.resources) && exp.resources.length > 0)) && (
                  <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5 text-sm">
                    {exp.tips && (
                      <p className="text-slate-200">
                        <strong className="text-amber-300 flex items-center gap-1 mb-1">
                          <span>💡</span> Candidate Prep Tips:
                        </strong>
                        {exp.tips}
                      </p>
                    )}
                    {Array.isArray(exp.resources) && exp.resources.length > 0 && (
                      <div className="mt-2 flex flex-wrap items-center gap-1.5 pt-2 border-t border-amber-500/10">
                        <span className="text-xs font-medium text-amber-300/80">Recommended Resources:</span>
                        {exp.resources.map((res, rIdx) => (
                          <span key={rIdx} className="rounded bg-amber-500/15 px-2 py-0.5 text-xs text-amber-200">
                            {res}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </PageShell>
  );
}

export default CompanyDetail;