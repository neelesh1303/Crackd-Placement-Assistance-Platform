import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import PageShell from "../components/PageShell";
import CompanyLabel from "../components/CompanyLabel";
import { useAuth } from "../context/AuthContext";

function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [experiences, setExperiences] = useState([]);
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

  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => {
    logout();
    navigate("/login", { replace: true });
  };

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
        const offers = allExperiences.filter((e) => e.offer).length;

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
                logo: exp.company?.logo || "📊",
                count: 0,
                lastRound: exp.round || "Unknown",
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
        // Add lastVisitDate to each company
        const upcomingCompanies = lastYearGrouped.map((company) => {
          const lastExp = company.exps.sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          )[0];
          const dateStr = lastExp?.createdAt ? new Date(lastExp.createdAt).toLocaleDateString() : "Date Unknown";
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

        setExperiences(allExperiences);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <p className="text-white text-xl">Loading dashboard...</p>
      </div>
    );
  }

  // Company card component
  const CompanyCard = ({ company, onClick, isClickable = true }) => (
    <div
      onClick={() => {
        if (!isClickable) return;
        if (company.slug) return navigate(`/companies/${company.slug}`);
        return onClick && onClick(company);
      }}
      className={`rounded-lg border border-slate-300 bg-white p-4 shadow-md transition-all hover:shadow-lg ${
        isClickable ? "cursor-pointer hover:border-blue-400 hover:scale-105" : ""
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
          <CompanyLabel company={company} size="md" />
        <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
          {company.count} times
        </span>
      </div>
      <p className="text-xs text-slate-500">Last: {company.lastRound}</p>
    </div>
  );

  // Experience details modal
  if (selectedCompany) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => setSelectedCompany(null)}
            className="mb-6 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-all"
          >
            ← Back to Dashboard
          </button>

          <div className="bg-white rounded-xl shadow-xl p-8">
            <div className="flex items-center gap-4 mb-8">
              <div>
                <CompanyLabel company={selectedCompany} size="lg" />
                <p className="text-slate-600">
                  {selectedCompany.count} recorded experiences
                </p>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">
                Past Experiences
              </h2>

              <div className="space-y-4">
                {selectedCompany.exps.map((exp, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-5 hover:bg-slate-100 transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-slate-900 text-lg">
                          {exp.role || "Role Not Specified"}
                        </h3>
                        <p className="text-sm text-slate-600">
                          {exp.round || "Round Unknown"} •{" "}
                          {new Date(exp.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      {exp.offer && (
                        <span className="inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                          ✓ Offer
                        </span>
                      )}
                    </div>

                    {exp.description && (
                      <p className="text-slate-700 mb-3">{exp.description}</p>
                    )}

                    <div className="grid grid-cols-2 gap-3 text-sm text-slate-600">
                      {exp.duration && (
                        <p>
                          <span className="font-semibold">Duration:</span>{" "}
                          {exp.duration}
                        </p>
                      )}
                      {exp.salary && (
                        <p>
                          <span className="font-semibold">Salary:</span>{" "}
                          {exp.salary}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main dashboard
  return (
    <PageShell
      title="Dashboard"
      subtitle="Quick access to companies, progress, roadmaps, and your weekly study plan."
      activeTab="dashboard"
      actions={
        <button
          type="button"
          onClick={handleSignOut}
          className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
        >
          Sign Out
        </button>
      }
    >
      <div className="space-y-10">
        <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">📊 Crackd</h1>
            <p className="text-slate-300 max-w-2xl">
              A polished prep dashboard built for placements. Navigate between companies, progress, experiences, and AI roadmap tools.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate("/companies")}
              className="rounded-full border border-slate-600 bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Companies
            </button>
            <button
              onClick={() => navigate("/progress")}
              className="rounded-full border border-slate-600 bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Progress
            </button>
          </div>
        </div>
          {/* Header */}
        {/* Stats Cards */}
        {activeTab === "overview" && (
          <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 animate-fade-up">
            <div className="relative rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 p-8 text-white shadow-2xl overflow-hidden group hover-lift">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mb-16"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-blue-100 text-sm font-semibold uppercase tracking-wider">Total Experiences</p>
                  <span className="text-3xl">📊</span>
                </div>
                <p className="text-5xl font-black mb-2">{stats.totalExperiences}</p>
                <p className="text-blue-200 text-sm">Interview rounds completed</p>
                <div className="mt-4 pt-4 border-t border-white/20 text-xs text-blue-100">Keep grinding! 💪</div>
              </div>
            </div>

            <div className="relative rounded-2xl bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 p-8 text-white shadow-2xl overflow-hidden group hover-lift">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mb-16"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-purple-100 text-sm font-semibold uppercase tracking-wider">Companies Visited</p>
                  <span className="text-3xl">🏢</span>
                </div>
                <p className="text-5xl font-black mb-2">{stats.companiesVisited}</p>
                <p className="text-purple-200 text-sm">Unique companies this year</p>
                <div className="mt-4 pt-4 border-t border-white/20 text-xs text-purple-100">Diversify your prep! 🎯</div>
              </div>
            </div>

            <div className="relative rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 p-8 text-white shadow-2xl overflow-hidden group hover-lift">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mb-16"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-emerald-100 text-sm font-semibold uppercase tracking-wider">Success Rate</p>
                  <span className="text-3xl">📈</span>
                </div>
                <p className="text-5xl font-black mb-2">{stats.totalExperiences > 0 ? Math.round((stats.companiesVisited / stats.totalExperiences) * 100) : 0}%</p>
                <p className="text-emerald-200 text-sm">Company diversity ratio</p>
                <div className="mt-4 pt-4 border-t border-white/20 text-xs text-emerald-100">You're doing great! ⭐</div>
              </div>
            </div>
          </div>

          {/* Quick Actions Section */}
          <div className="mb-10 animate-fadeInUp" style={{animationDelay: '0.1s'}}>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <span className="text-3xl">⭐</span> Quick Actions & Insights
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <div onClick={() => navigate('/companies')} className="relative rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/40 p-6 cursor-pointer group hover:border-cyan-500/80 hover:from-cyan-500/30 hover:to-blue-500/30 transition-all duration-300 hover:-translate-y-1 transform">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-white/0 to-cyan-500/0 group-hover:from-cyan-500/10 group-hover:via-white/10 group-hover:to-cyan-500/10 rounded-xl transition-all duration-300"></div>
                <div className="relative z-10">
                  <p className="text-4xl mb-3">📚</p>
                  <h3 className="font-bold text-white text-lg mb-2">Browse Companies</h3>
                  <p className="text-sm text-slate-300">Explore all companies visiting campus</p>
                </div>
              </div>

              <div onClick={() => navigate('/progress')} className="relative rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/40 p-6 cursor-pointer group hover:border-purple-500/80 hover:from-purple-500/30 hover:to-pink-500/30 transition-all duration-300 hover:-translate-y-1 transform">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-white/0 to-purple-500/0 group-hover:from-purple-500/10 group-hover:via-white/10 group-hover:to-purple-500/10 rounded-xl transition-all duration-300"></div>
                <div className="relative z-10">
                  <p className="text-4xl mb-3">📈</p>
                  <h3 className="font-bold text-white text-lg mb-2">Track Progress</h3>
                  <p className="text-sm text-slate-300">Monitor your preparation status</p>
                </div>
              </div>

              <div onClick={() => navigate('/roadmap')} className="relative rounded-xl bg-gradient-to-br from-green-500/20 to-teal-500/20 border border-green-500/40 p-6 cursor-pointer group hover:border-green-500/80 hover:from-green-500/30 hover:to-teal-500/30 transition-all duration-300 hover:-translate-y-1 transform">
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/0 via-white/0 to-green-500/0 group-hover:from-green-500/10 group-hover:via-white/10 group-hover:to-green-500/10 rounded-xl transition-all duration-300"></div>
                <div className="relative z-10">
                  <p className="text-4xl mb-3">🗺️</p>
                  <h3 className="font-bold text-white text-lg mb-2">Roadmap</h3>
                  <p className="text-sm text-slate-300">Generate AI-powered roadmaps</p>
                </div>
              </div>
            </div>
          </div>

          {/* Top Companies Section */}
          {data.predictedUpcoming.length > 0 && (
            <div className="mb-10 animate-fadeInUp" style={{animationDelay: '0.2s'}}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <span className="text-3xl">🔥</span> Most Likely Upcoming Companies
                </h2>
                <button onClick={() => setActiveTab('predicted')} className="text-sm px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-all">View All →</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {data.predictedUpcoming.slice(0, 3).map((company, idx) => (
                  <div key={idx} onClick={() => company.slug ? navigate(`/companies/${company.slug}`) : setSelectedCompany(company)} className="relative rounded-xl border-2 border-amber-400 bg-gradient-to-br from-slate-800 to-slate-900 p-6 cursor-pointer group hover:shadow-2xl hover:border-amber-300 transition-all duration-300 overflow-hidden hover-lift">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
                    <div className="absolute -top-3 -right-3 rounded-full bg-gradient-to-r from-amber-400 to-yellow-400 w-12 h-12 flex items-center justify-center text-white font-bold text-lg shadow-lg">#{idx + 1}</div>
                        <div className="relative z-10">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full flex items-center justify-center text-base bg-white/10 text-white shadow-sm">{company.logo}</div>
                              <h3 className="font-bold text-white text-xl mb-0">{company.name}</h3>
                            </div>
                            <span className="inline-block rounded-full bg-amber-400/20 border border-amber-400 text-amber-300 px-3 py-1 text-xs font-bold">{company.count}x</span>
                          </div>
                      <p className="text-xs text-slate-400 mb-4">Last visited: <span className="text-amber-300 font-semibold">{company.lastVisitDate}</span></p>
                      <div className="pt-4 border-t border-slate-700">
                        <p className="text-xs text-slate-300">Prepare for this company next! 🎯</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stats & Tips Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10 animate-fadeInUp" style={{animationDelay: '0.3s'}}>
            <div className="rounded-xl border border-slate-700 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-6 backdrop-blur">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><span>📊</span> Year-wise Activity</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-slate-300">This Year</span>
                    <span className="text-lg font-bold text-blue-400">{data.thisYear.length}</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-400 to-blue-600 h-full rounded-full transition-all duration-500" style={{width: `${Math.min((data.thisYear.length / Math.max(data.thisYear.length, data.lastYear.length, 1)) * 100, 100)}%`}}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-slate-300">Last Year</span>
                    <span className="text-lg font-bold text-purple-400">{data.lastYear.length}</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-400 to-purple-600 h-full rounded-full transition-all duration-500" style={{width: `${Math.min((data.lastYear.length / Math.max(data.thisYear.length, data.lastYear.length, 1)) * 100, 100)}%`}}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-700 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-6 backdrop-blur">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><span>💡</span> Pro Tips</h3>
              <div className="space-y-3">
                <div className="flex gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                  <span>✨</span>
                  <p className="text-sm text-slate-300">Generate AI-powered roadmaps for each company</p>
                </div>
                <div className="flex gap-3 p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
                  <span>📝</span>
                  <p className="text-sm text-slate-300">Track your progress with daily streaks</p>
                </div>
                <div className="flex gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                  <span>🎯</span>
                  <p className="text-sm text-slate-300">Focus on weak topics before interviews</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main CTA Section */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-10 text-center shadow-2xl mb-10 animate-fadeInUp" style={{animationDelay: '0.4s'}}>
            <h2 className="text-3xl font-bold text-white mb-4">Ready to Start Your Preparation?</h2>
            <p className="text-blue-100 mb-8 text-lg">Choose your next step and accelerate your placement journey.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button onClick={() => navigate('/companies')} className="px-8 py-4 rounded-lg bg-white text-blue-600 font-bold hover:bg-blue-50 transition-all shadow-lg hover-lift">📚 Explore Companies</button>
              <button onClick={() => navigate('/roadmap')} className="px-8 py-4 rounded-lg bg-blue-700 text-white font-bold hover:bg-blue-800 transition-all shadow-lg hover-lift border border-white/20">🗺️ Generate Roadmap</button>
            </div>
          </div>
          </>
        )}

        {error && (
          <div className="mb-6 rounded-lg bg-red-500/10 border border-red-500/50 p-4 text-red-300">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="mb-8 flex gap-3 border-b border-slate-700 overflow-x-auto pb-4">
          {[
            { id: "overview", label: "📊 Overview" },
            { id: "thisYear", label: "🎯 This Year" },
            { id: "lastYear", label: "📅 Last Year" },
            { id: "predicted", label: "🔥 Upcoming (Most Likely)" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap px-5 py-3 font-semibold rounded-lg transition-all ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white shadow-lg"
                  : "text-slate-300 hover:text-white hover:bg-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div>
          {/* This Year Tab */}
          {activeTab === "thisYear" && (
            <div>
              {data.thisYear.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {data.thisYear.map((company) => (
                    <CompanyCard
                      key={company.name}
                      company={company}
                      onClick={setSelectedCompany}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-center text-slate-400 py-12">
                  No experiences recorded this year yet
                </p>
              )}
            </div>
          )}

          {/* Last Year Tab */}
          {activeTab === "lastYear" && (
            <div>
              {data.lastYear.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {data.lastYear.map((company) => (
                    <CompanyCard
                      key={company.name}
                      company={company}
                      onClick={setSelectedCompany}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-center text-slate-400 py-12">
                  No experiences recorded last year
                </p>
              )}
            </div>
          )}

          {/* Upcoming Companies Tab */}
          {activeTab === "predicted" && (
            <div>
              <div className="mb-6 rounded-lg bg-amber-500/10 border border-amber-500/30 p-4">
                <p className="text-amber-300 text-sm">
                  📈 Companies from last year, ranked by recent activity. Likely to visit again soon.
                </p>
              </div>

              {data.predictedUpcoming.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {data.predictedUpcoming.map((company, idx) => (
                    <div
                      key={idx}
                      className="relative rounded-lg border-2 border-amber-400 bg-white p-4 shadow-lg hover:shadow-xl transition-all"
                    >
                      <div className="absolute -top-3 -right-3 rounded-full bg-amber-400 w-8 h-8 flex items-center justify-center text-white font-bold text-sm">
                        #{idx + 1}
                      </div>
                      <div className="flex items-start justify-between mb-3">
                        <div className="text-4xl">{company.logo}</div>
                        <span className="inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                          {company.count}x visited
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-lg mb-1">
                        {company.name}
                      </h3>
                      <p className="text-xs text-slate-500 mb-3">
                        Last visited: {company.lastVisitDate}
                      </p>
                      <button
                        onClick={() => company.slug ? navigate(`/companies/${company.slug}`) : setSelectedCompany(company)}
                        className="w-full rounded-lg bg-amber-400 text-slate-900 font-semibold py-2 hover:bg-amber-500 transition-all"
                      >
                        View Experiences →
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-slate-400 py-12">
                  No companies from last year data yet
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-700 bg-slate-800/50 p-6 mt-12">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="text-white font-bold mb-2">About Crackd</h3>
              <p className="text-slate-400 text-sm">
                Where preparation meets opportunity. 
                
                Track your placement journey and prepare for companies with personalized roadmaps.
              </p>
            </div>
            <div>
              <h3 className="text-white font-bold mb-2">Quick Links</h3>
              <ul className="space-y-1 text-slate-400 text-sm">
                <li><button onClick={() => navigate('/companies')} className="hover:text-white transition">Companies</button></li>
                <li><button onClick={() => navigate('/progress')} className="hover:text-white transition">Progress</button></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold mb-2">Help & Support</h3>
              <p className="text-slate-400 text-sm">
                Need help? Check the documentation or reach out to support.
              </p>
            </div>
          </div>
          <div className="border-t border-slate-700 pt-6 text-center text-slate-400 text-sm">
            <p>© 2026 Crackd. All rights reserved. Built for placement success.</p>
          </div>
        </div>
      </footer>
    </PageShell>
  );
}

export default Dashboard;
