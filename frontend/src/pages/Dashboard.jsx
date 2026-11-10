import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import PageShell from "../components/PageShell";
import CompanyLabel from "../components/CompanyLabel";
import { Empty, Loader, Notice } from "../components/Bits";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "thisYear", label: "This year" },
  { id: "lastYear", label: "Last year" },
  { id: "predicted", label: "Likely upcoming" },
];

const QUICK = [
  { no: "A", title: "Browse companies", body: "Every company that's visited, with round-by-round notes.", to: "/companies" },
  { no: "B", title: "Build a roadmap", body: "Pick weak topics, get a week-by-week plan.", to: "/roadmap" },
  { no: "C", title: "Check progress", body: "Your checklist, streak and readiness meter.", to: "/progress" },
];

// Ek company ka chhota card — click karne par company page ya experiences list khulti hai
function DeskCompanyCard({ company, onOpen, rank, index = 0 }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(company)}
      className="sheet lift rise relative flex w-full flex-col p-5 text-left"
      style={{ "--i": index }}
    >
      {rank && <span className="stamp absolute -top-3 right-4 bg-[color:var(--sheet)]">#{rank}</span>}
      <CompanyLabel company={company} size="md" />
      <div className="mt-5 flex items-center justify-between gap-3 border-t border-dashed border-[color:var(--ink-3)] pt-3">
        <span className="mono text-xs muted">
          {company.lastVisitDate ? `last seen ${company.lastVisitDate}` : `${company.count} experience${company.count === 1 ? "" : "s"}`}
        </span>
        <span className="tag tag-hi">{company.count}×</span>
      </div>
    </button>
  );
}

function CompanyGrid({ companies, onOpen, ranked = false, emptyText }) {
  if (companies.length === 0) {
    return <Empty title="Nothing here yet.">{emptyText}</Empty>;
  }
  return (
    <div className="grid grid-cols-1 gap-6 pt-3 md:grid-cols-2 lg:grid-cols-3">
      {companies.map((company, idx) => (
        <DeskCompanyCard
          key={company.name}
          company={company}
          onOpen={onOpen}
          rank={ranked ? idx + 1 : undefined}
          index={idx % 9}
        />
      ))}
    </div>
  );
}

function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({
    totalExperiences: 0,
    companiesVisited: 0,
    offersReceived: 0,
  });

  // Company data grouped by year
  const [data, setData] = useState({
    thisYear: [],
    lastYear: [],
    predictedUpcoming: [],
  });

  const navigate = useNavigate();

  // Fetch all experiences on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const res = await api.get("/experiences");
        const allExperiences = res.data.experiences || [];

        // Calculate stats
        const uniqueCompanies = new Set(
          allExperiences.map((e) => e.company?.name)
        ).size;
        const offers = allExperiences.filter((e) => e.gotOffer || e.offer).length;

        setStats({
          totalExperiences: allExperiences.length,
          companiesVisited: uniqueCompanies,
          offersReceived: offers,
        });

        // Group by year
        const now = new Date();
        const currentYear = now.getFullYear();
        const thisYearExps = allExperiences.filter((e) => {
          const year = new Date(e.createdAt).getFullYear();
          return year === currentYear;
        });

        const lastYearExps = allExperiences.filter((e) => {
          const year = new Date(e.createdAt).getFullYear();
          return year === currentYear - 1;
        });

        // Group by company
        const groupByCompany = (exps) => {
          const grouped = {};
          exps.forEach((exp) => {
            const name = exp.company?.name || "Unknown";
            if (!grouped[name]) {
              grouped[name] = {
                name,
                slug: exp.company?.slug || "",
                logo: exp.company?.logo || "",
                count: 0,
                exps: [],
              };
            }
            grouped[name].count++;
            grouped[name].exps.push(exp);
          });
          return Object.values(grouped).sort((a, b) => b.count - a.count);
        };

        // Upcoming companies (most likely) - based on last year visits, with dates
        const lastYearGrouped = groupByCompany(lastYearExps);
        const upcomingCompanies = lastYearGrouped.map((company) => {
          const lastExp = company.exps.sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          )[0];
          const dateStr = lastExp?.createdAt
            ? new Date(lastExp.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })
            : "date unknown";
          return {
            ...company,
            lastVisitDate: dateStr,
          };
        }).sort((a, b) => {
          // Sort by the original exps createdAt, not the formatted string
          const aDate = a.exps[0]?.createdAt ? new Date(a.exps[0].createdAt) : new Date(0);
          const bDate = b.exps[0]?.createdAt ? new Date(b.exps[0].createdAt) : new Date(0);
          return bDate - aDate;
        });

        setData({
          thisYear: groupByCompany(thisYearExps),
          lastYear: groupByCompany(lastYearExps),
          predictedUpcoming: upcomingCompanies,
        });

      } catch (err) {
        setError(err.response?.data?.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // company slug ho to company page par jao, warna yahin experiences dikhao
  const openCompany = (company) => {
    if (company.slug) return navigate(`/companies/${company.slug}`);
    return setSelectedCompany(company);
  };

  if (loading) {
    return (
      <PageShell title="Your desk" activeTab="dashboard">
        <Loader label="Spreading out the notes" />
      </PageShell>
    );
  }

  // Experience list for a company without its own page
  if (selectedCompany) {
    return (
      <PageShell
        title={selectedCompany.name}
        subtitle={`${selectedCompany.count} recorded experience${selectedCompany.count === 1 ? "" : "s"}.`}
        activeTab="dashboard"
        actions={
          <button type="button" onClick={() => setSelectedCompany(null)} className="btn">
            ← Back to desk
          </button>
        }
      >
        <div className="space-y-5">
          {selectedCompany.exps.map((exp, idx) => (
            <article key={exp._id || idx} className="sheet sheet-pad rise" style={{ "--i": idx % 8 }}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-extrabold">{exp.role || "Role not specified"}</h3>
                  <p className="mono mt-1 text-xs muted">
                    {exp.year ? `year ${exp.year} · ` : ""}
                    {Array.isArray(exp.rounds) ? `${exp.rounds.length} rounds · ` : ""}
                    {new Date(exp.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {(exp.gotOffer || exp.offer) && <span className="stamp stamp-green">Offer</span>}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {exp.ctc && <span className="tag tag-hi">₹ {exp.ctc}</span>}
                {exp.prepTime && <span className="tag">prep · {exp.prepTime}</span>}
              </div>
              {exp.tips && <p className="mt-4 muted">{exp.tips}</p>}
            </article>
          ))}
        </div>
      </PageShell>
    );
  }

  const maxYear = Math.max(data.thisYear.length, data.lastYear.length, 1);

  // Main dashboard
  return (
    <PageShell
      title="Your desk"
      subtitle="Placement season at a glance — who's coming, what's been asked, and where to go next."
      activeTab="dashboard"
      note="start with the companies likely to come back ↓"
      actions={
        <button type="button" onClick={() => navigate("/roadmap")} className="btn btn-hi">
          Build a roadmap <span className="arrow">→</span>
        </button>
      }
    >
      {error && <div className="mb-6"><Notice tone="error">{error}</Notice></div>}

      <div className="folder-tabs mb-10" role="tablist">
        {TABS.map((tab) => {
          const count =
            tab.id === "thisYear" ? data.thisYear.length
            : tab.id === "lastYear" ? data.lastYear.length
            : tab.id === "predicted" ? data.predictedUpcoming.length
            : null;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`folder-tab ${activeTab === tab.id ? "is-active" : ""}`}
            >
              {tab.label}
              {count !== null && <small>{count}</small>}
            </button>
          );
        })}
      </div>

      {activeTab === "overview" && (
        <div className="space-y-16">
          {/* Stats */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              { label: "Experiences logged", value: stats.totalExperiences, note: "stories from seniors" },
              { label: "Companies on record", value: stats.companiesVisited, note: "different companies" },
              { label: "Offers logged", value: stats.offersReceived, note: "people who made it" },
            ].map((stat, i) => (
              <div key={stat.label} className="sheet sheet-pad rise" style={{ "--i": i }}>
                <p className="kicker">{stat.label}</p>
                <p className="stat-num mt-4">{stat.value}</p>
                <p className="hand mt-2 text-xl text-[color:var(--blue)]">{stat.note}</p>
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <section>
            <h2 className="section-title"><span className="mono">A–C</span> Where to next</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {QUICK.map((item, i) => (
                <button
                  key={item.no}
                  type="button"
                  onClick={() => navigate(item.to)}
                  className="sheet lift rise group p-6 text-left"
                  style={{ "--i": i + 3 }}
                >
                  <span className="circled mono text-sm font-bold">{item.no}</span>
                  <h3 className="mt-5 text-2xl font-extrabold">{item.title}</h3>
                  <p className="mt-2 text-sm muted">{item.body}</p>
                  <span className="mt-5 inline-block font-bold transition-transform group-hover:translate-x-1">Go →</span>
                </button>
              ))}
            </div>
          </section>

          {/* Upcoming */}
          {data.predictedUpcoming.length > 0 && (
            <section>
              <div className="mb-1 flex flex-wrap items-baseline justify-between gap-3">
                <h2 className="section-title"><span className="mono">hot</span> Likely to come back</h2>
                <button type="button" onClick={() => setActiveTab("predicted")} className="link-ink text-sm">
                  See all {data.predictedUpcoming.length}
                </button>
              </div>
              <CompanyGrid companies={data.predictedUpcoming.slice(0, 3)} onOpen={openCompany} ranked />
            </section>
          )}

          {/* Activity + tips */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.3fr_1fr]">
            <section className="sheet sheet-pad">
              <h2 className="section-title"><span className="mono">log</span> Companies, year by year</h2>
              {[
                { label: "This year", value: data.thisYear.length, cls: "" },
                { label: "Last year", value: data.lastYear.length, cls: "is-low" },
              ].map((row) => (
                <div key={row.label} className="mt-5">
                  <div className="mb-2 flex items-baseline justify-between">
                    <span className="font-semibold">{row.label}</span>
                    <span className="mono text-sm">{row.value}</span>
                  </div>
                  <div className="meter">
                    <div className={`meter-fill ${row.cls}`} style={{ width: `${Math.min((row.value / maxYear) * 100, 100)}%` }} />
                  </div>
                </div>
              ))}
            </section>

            <aside className="postit self-start">
              <p className="kicker">Margin notes</p>
              <ul className="hand mt-3 space-y-2 text-2xl">
                <li>→ make a roadmap per company</li>
                <li>→ one topic a day beats ten on Sunday</li>
                <li>→ weak topics first, always</li>
              </ul>
            </aside>
          </div>
        </div>
      )}

      {activeTab === "thisYear" && (
        <CompanyGrid companies={data.thisYear} onOpen={openCompany} emptyText="No experiences recorded this year yet." />
      )}

      {activeTab === "lastYear" && (
        <CompanyGrid companies={data.lastYear} onOpen={openCompany} emptyText="No experiences recorded last year." />
      )}

      {activeTab === "predicted" && (
        <div className="space-y-6">
          <Notice tone="info">
            Companies from last year, ranked by how recently they showed up. They're the most likely to visit again.
          </Notice>
          <CompanyGrid companies={data.predictedUpcoming} onOpen={openCompany} ranked emptyText="No companies from last year yet." />
        </div>
      )}
    </PageShell>
  );
}

export default Dashboard;
