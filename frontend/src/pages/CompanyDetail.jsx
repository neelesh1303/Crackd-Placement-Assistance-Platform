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
          <div className="space-y-4">
            {experiences.map((exp) => (
              <div
                key={exp._id}
                className="rounded-xl border border-white/10 bg-slate-900/80 p-5 shadow-sm"
              >

                {/* Experience metadata */}
                <div className="mb-4 flex flex-wrap items-center gap-3">

                  <span className="rounded bg-slate-800 px-2 py-1 text-xs text-slate-200">
                    Role: {exp.role || "N/A"}
                  </span>

                  <span className="rounded bg-slate-800 px-2 py-1 text-xs text-slate-200">
                    Year: {exp.year || "N/A"}
                  </span>

                  <span className="rounded bg-slate-800 px-2 py-1 text-xs text-slate-200">
                    Offer: {exp.gotOffer ? "Yes" : "No"}
                  </span>

                </div>

                {/* Tips */}
                {exp.tips ? (
                  <p className="mb-4 text-sm text-slate-300">
                    <span className="font-semibold text-white">
                      Tips:
                    </span>{" "}
                    {exp.tips}
                  </p>
                ) : null}

                {/* Rounds */}
                {Array.isArray(exp.rounds) &&
                exp.rounds.length > 0 ? (
                  <div>

                    <h3 className="mb-3 text-sm font-semibold text-white">
                      Rounds
                    </h3>

                    <div className="space-y-3">

                      {exp.rounds.map((round, idx) => (
                        <div
                          key={idx}
                          className="rounded-lg border border-white/10 bg-slate-950/50 p-4"
                        >

                          {/* Round title */}
                          <p className="text-sm font-semibold text-white">
                            Round {round.roundNo}:{" "}
                            {round.type || "Interview"}
                          </p>

                          {/* Description */}
                          {round.description ? (
                            <p className="mt-2 text-sm leading-6 text-slate-300">
                              {round.description}
                            </p>
                          ) : null}

                          {/* Problems */}
                          {Array.isArray(
                            round.problemsAsked
                          ) &&
                          round.problemsAsked.length > 0 ? (
                            <div className="mt-3 text-sm text-slate-300">

                              <p className="font-semibold text-white">
                                Problems asked:
                              </p>

                              <ul className="mt-2 list-disc space-y-1 pl-5">
                                {round.problemsAsked.map(
                                  (problem, pIdx) => (
                                    <li key={pIdx}>
                                      {problem}
                                    </li>
                                  )
                                )}
                              </ul>

                            </div>
                          ) : null}

                        </div>
                      ))}

                    </div>
                  </div>
                ) : null}

              </div>
            ))}
          </div>
        </div>

      </div>
    </PageShell>
  );
}

export default CompanyDetail;