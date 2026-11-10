import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import PageShell from "../components/PageShell";
import CompanyLabel from "../components/CompanyLabel";
import { Empty, Loader, Notice } from "../components/Bits";

// round type ke hisab se tag color
const roundTag = (type) => {
  const t = String(type || "").toUpperCase();
  if (t.includes("OA")) return "tag tag-blue";
  if (t.includes("TECH") || t.includes("DSA")) return "tag tag-green";
  if (t.includes("HR") || t.includes("MANAGE")) return "tag tag-pink";
  if (t.includes("LLD") || t.includes("SYSTEM")) return "tag tag-hi";
  return "tag";
};

const difficultyStamp = (difficulty) => {
  if (difficulty === "Hard") return "stamp";
  if (difficulty === "Medium") return "stamp stamp-blue";
  return "stamp stamp-green";
};

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

  // Prepare roadmap for this company — sabse zyada pooche gaye topics ko weak mark karke roadmap page par bhejte hain
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

  const backLink = (
    <Link to="/companies" className="btn">
      ← All companies
    </Link>
  );

  if (loading) {
    return (
      <PageShell title="Opening the file" activeTab="companies">
        <Loader label="Opening the file" />
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell title="Company file" activeTab="companies" actions={backLink}>
        <Notice tone="error">{error}</Notice>
      </PageShell>
    );
  }

  if (!company) {
    return (
      <PageShell title="Company file" activeTab="companies" actions={backLink}>
        <Empty title="No file with that name." action={backLink}>
          This company isn't in the records yet.
        </Empty>
      </PageShell>
    );
  }

  const offers = experiences.filter((exp) => exp.gotOffer).length;

  return (
    <PageShell
      title={company.name || "Company file"}
      subtitle="Everything seniors wrote down after interviewing here — round by round."
      activeTab="companies"
      actions={backLink}
    >
      <div className="grid gap-10 lg:grid-cols-[20rem_1fr]">
        {/* ===== Company summary (sidebar) ===== */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="sheet taped sheet-pad">
            <div className="flex items-start justify-between gap-3">
              <CompanyLabel company={company} size="lg" hideName />
              {company.difficulty && <span className={difficultyStamp(company.difficulty)}>{company.difficulty}</span>}
            </div>

            <dl className="mt-6 space-y-3 text-sm">
              <div className="flex justify-between gap-4 border-b border-dashed border-[color:var(--ink-3)] pb-2">
                <dt className="mono muted">visits</dt>
                <dd className="font-bold">
                  {company.visitMonth || "TBA"}
                  {company.visitYear ? ` ${company.visitYear}` : ""}
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-dashed border-[color:var(--ink-3)] pb-2">
                <dt className="mono muted">experiences</dt>
                <dd className="font-bold">{experiences.length}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="mono muted">offers logged</dt>
                <dd className="font-bold">{offers}</dd>
              </div>
            </dl>

            {(company.roles || []).length > 0 && (
              <div className="mt-6">
                <p className="field-label">Roles</p>
                <div className="flex flex-wrap gap-1.5">
                  {company.roles.map((role) => (
                    <span key={role} className="tag">{role}</span>
                  ))}
                </div>
              </div>
            )}

            <button type="button" onClick={handlePrepare} className="btn btn-ink btn-block mt-7">
              Prep for {company.name} <span className="arrow">→</span>
            </button>
            <p className="hand mt-3 text-center text-lg text-[color:var(--blue)]">
              builds a roadmap from the topics they ask most
            </p>
          </div>
        </aside>

        {/* ===== Experiences ===== */}
        <section>
          <h2 className="section-title">
            <span className="mono">{String(experiences.length).padStart(2, "0")}</span> Interview experiences
          </h2>

          {experiences.length === 0 && (
            <Empty
              title="No stories yet."
              action={<Link to="/add-experience" className="btn btn-hi">Be the first to write one</Link>}
            >
              Nobody has written about interviewing here yet.
            </Empty>
          )}

          <div className="space-y-8">
            {experiences.map((exp, expIndex) => (
              <article key={exp._id} className="sheet rise overflow-hidden" style={{ "--i": expIndex % 6 }}>
                {/* header */}
                <header className="flex flex-wrap items-center justify-between gap-3 border-b-[1.5px] border-[color:var(--ink)] bg-[color:var(--paper-2)] px-5 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-lg font-extrabold">{exp.role || "Role unspecified"}</span>
                    <span className="tag">{exp.year || exp.visitYear || "year n/a"}</span>
                    {exp.ctc && <span className="tag tag-hi">₹ {exp.ctc} LPA</span>}
                    {exp.cgpaCutoff && <span className="tag">CGPA {exp.cgpaCutoff}+</span>}
                  </div>
                  {exp.gotOffer ? (
                    <span className="stamp stamp-green">Got the offer</span>
                  ) : (
                    <span className="mono text-xs muted">no offer</span>
                  )}
                </header>

                <div className="p-5 sm:p-6">
                  {/* rounds as a timeline */}
                  {Array.isArray(exp.rounds) && exp.rounds.length > 0 && (
                    <ol className="relative m-0 list-none space-y-6 border-l-[1.5px] border-dashed border-[color:var(--ink)] p-0 pl-6">
                      {exp.rounds.map((round, idx) => (
                        <li key={idx} className="relative">
                          <span className="absolute -left-[2.2rem] top-0 grid h-7 w-7 place-items-center rounded-full border-[1.5px] border-[color:var(--ink)] bg-[color:var(--sheet)] font-mono text-xs font-bold">
                            {round.roundNo || idx + 1}
                          </span>

                          <div className="flex flex-wrap items-center gap-2">
                            <span className={roundTag(round.type)}>{round.type || "Interview"}</span>
                            {round.duration && <span className="mono text-xs muted">⏱ {round.duration}</span>}
                          </div>

                          {round.description && (
                            <p className="mt-3 whitespace-pre-line leading-relaxed">{round.description}</p>
                          )}

                          {Array.isArray(round.problemsAsked) && round.problemsAsked.filter(Boolean).length > 0 && (
                            <div className="mt-3">
                              <p className="field-label">Problems asked</p>
                              <ul className="m-0 list-none space-y-1 p-0">
                                {round.problemsAsked.filter(Boolean).map((problem, pIdx) => (
                                  <li key={pIdx} className="mono text-sm">
                                    <span className="text-[color:var(--red)]">›</span> <span className="hl">{problem}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {Array.isArray(round.topics) && round.topics.filter(Boolean).length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {round.topics.filter(Boolean).map((topic, tIdx) => (
                                <span key={tIdx} className="tag tag-ghost">#{topic}</span>
                              ))}
                            </div>
                          )}
                        </li>
                      ))}
                    </ol>
                  )}

                  {/* tips + resources */}
                  {(exp.tips || (Array.isArray(exp.resources) && exp.resources.length > 0)) && (
                    <div className="postit mt-8">
                      {exp.tips && (
                        <>
                          <p className="kicker">Their advice</p>
                          <p className="hand mt-2 text-2xl leading-snug">“{exp.tips}”</p>
                        </>
                      )}
                      {Array.isArray(exp.resources) && exp.resources.length > 0 && (
                        <div className="mt-3 flex flex-wrap items-center gap-1.5">
                          <span className="mono text-xs">used:</span>
                          {exp.resources.map((res, rIdx) => (
                            <span key={rIdx} className="tag">{res}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </PageShell>
  );
}

export default CompanyDetail;
