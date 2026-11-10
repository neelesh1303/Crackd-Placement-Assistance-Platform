//is page ka kaam hai AI Roadmap Generator ko implement karna, jisme user apne target company aur role ke hisab se personalized study plan generate kar sakta hai. is page par ek form diya gaya hai jisme user apne target company, role, preparation duration (weeks), daily study hours, weak topics, aur strong topics input kar sakta hai. jab user form submit karta hai to ye data backend ke /api/roadmap/generate endpoint par bheja jata hai, jahan se AI ke dwara customized roadmap generate hota hai. generated roadmap me weekly study plan aur topic checklist hoti hai, jise user apne progress ke hisab se manage kar sakta hai. user roadmap ko tracker me save bhi kar sakta hai, taki wo apne placement preparation ke progress ko effectively track kar sake.

import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../services/api";
import PageShell from "../components/PageShell";
import { Loader, Notice } from "../components/Bits";

const STATES = ["todo", "in-progress", "done"];

// DSA aur Core CS topics ki predefined list — ye form ke upar user ko dikhaye jaate hain
// User in chips par click karke apne weak ya strong topics select kar sakta hai
const DSA_TOPICS = [
  "Arrays",
  "Strings",
  "Hashing",
  "Sliding Window",
  "Two Pointers",
  "Stack",
  "Queue",
  "Linked List",
  "Binary Search",
  "Recursion",
  "Backtracking",
  "Trees",
  "Binary Search Tree",
  "Heaps",
  "Graphs",
  "BFS & DFS",
  "Dynamic Programming",
  "Greedy",
  "Bit Manipulation",
  "Math & Number Theory",
];

const CORE_TOPICS = [
  "OOP Concepts",
  "DBMS",
  "SQL Queries",
  "Operating Systems",
  "Computer Networks",
  "System Design Basics",
  "LLD Basics",
  "Process & Threads",
  "Memory Management",
  "TCP/IP & HTTP",
];

function RoadmapGenerator() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [roadmap, setRoadmap] = useState(null);

  // topicMap: ek object jisme har topic ka state store hota hai
  // possible values: "weak", "strong", ya undefined (unselected)
  // Example: { "Arrays": "weak", "DBMS": "strong" }
  const [topicMap, setTopicMap] = useState({});

  const [form, setForm] = useState({
    companySlug: "",
    role: "SDE Intern",
    weeks: 8,
    hoursPerDay: 3,
  });

  // companies backend se fetch karte hain taaki dropdown me options mile
  const location = useLocation();

  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const res = await api.get("/companies");
        setCompanies(res.data.companies || []);
      } catch {
        setCompanies([]);
      }
    };
    loadCompanies();

    // apply prefill from navigation state (companySlug, weakTopics, strongTopics)
    if (location?.state) {
      const { companySlug, weakTopics = [], strongTopics = [] } = location.state;
      if (companySlug) setForm((f) => ({ ...f, companySlug }));

      // build topicMap from weak/strong topics
      const pre = {};
      (weakTopics || []).forEach((t) => (pre[t] = "weak"));
      (strongTopics || []).forEach((t) => (pre[t] = "strong"));
      if (Object.keys(pre).length > 0) setTopicMap((tm) => ({ ...pre, ...tm }));
    }
  }, [location]);

  // jab user kisi topic chip par click karta hai to ye function call hota hai
  // pehli click → "weak" (lal), doosri click → "strong" (hara), teesri click → unselect
  const handleTopicClick = (topic) => {
    setTopicMap((prev) => {
      const current = prev[topic]; // current state of this topic
      if (!current) return { ...prev, [topic]: "weak" };       // unselected → weak
      if (current === "weak") return { ...prev, [topic]: "strong" }; // weak → strong
      // strong → remove karo (unselect)
      const updated = { ...prev };
      delete updated[topic];
      return updated;
    });
  };

  // topicMap se weak aur strong topics ke alag-alag arrays nikalte hain
  // ye arrays payload me bheje jaate hain backend ko
  const getWeakTopics = () =>
    Object.entries(topicMap)
      .filter(([, v]) => v === "weak")
      .map(([k]) => k);

  const getStrongTopics = () =>
    Object.entries(topicMap)
      .filter(([, v]) => v === "strong")
      .map(([k]) => k);

  // saare chips ek baar me reset karne ke liye — "Clear All" button ke liye
  const clearAllTopics = () => setTopicMap({});

  const generate = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");
      setMessage("");
      setRoadmap(null);

      // weak aur strong topics topicMap se nikalte hain, manual text input ab nahi hai
      const payload = {
        ...form,
        weeks: Number(form.weeks),
        hoursPerDay: Number(form.hoursPerDay),
        weakTopics: getWeakTopics(),
        strongTopics: getStrongTopics(),
      };

      const res = await api.post("/roadmap/generate", payload);
      setRoadmap(res.data.roadmap || null);
    } catch (err) {
      const message = err.response?.data?.message;
      if (message) {
        setError(message);
      } else if (err.code === "ECONNABORTED") {
        setError("Roadmap generation timed out. Please try again.");
      } else if (!err.response) {
        setError("Roadmap service is unreachable. Please check the backend deployment.");
      } else {
        setError("Roadmap generation failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // checklist item ka state cycle karta hai: todo → in-progress → done → todo
  const cycleState = (topic) => {
    setRoadmap((prev) => {
      if (!prev) return prev;
      const checklist = prev.checklist.map((item) => {
        if (item.topic !== topic) return item;
        const idx = STATES.indexOf(item.state);
        const next = STATES[(idx + 1) % STATES.length];
        return { ...item, state: next };
      });
      return { ...prev, checklist };
    });
  };

  const saveToTracker = async () => {
    if (!roadmap) return;
    try {
      setSaving(true);
      setError("");
      setMessage("");
      await api.post("/tracker/save-roadmap", roadmap);
      setMessage("Roadmap saved to Tracker");
    } catch (err) {
      setError(err.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  // topic chip ka class decide karta hai uske current state ke hisab se
  // weak = red pen, strong = green highlighter, unselected = plain
  const getChipClass = (topic) => {
    const state = topicMap[topic];
    if (state === "weak") return "chip is-weak";
    if (state === "strong") return "chip is-strong";
    return "chip";
  };

  const chipMark = (topic) => {
    if (topicMap[topic] === "weak") return <span className="mark">✗</span>;
    if (topicMap[topic] === "strong") return <span className="mark">✓</span>;
    return null;
  };

  // selected weak aur strong topics ki count — summary me dikhate hain
  const weakCount = getWeakTopics().length;
  const strongCount = getStrongTopics().length;

  const checklistTag = (state) =>
    state === "done" ? "chip is-strong" : state === "in-progress" ? "chip is-progress" : "chip";

  return (
    <PageShell
      title={<>Plan the <span className="hl">grind</span>.</>}
      subtitle="Mark what you're weak and strong at, tell us how much time you've got, and get a week-by-week roadmap."
      activeTab="roadmap"
      note="be honest about the weak ones"
      actions={
        <button type="button" onClick={() => navigate("/progress")} className="btn">
          My progress
        </button>
      }
    >
      <div className="space-y-8">
        {error && <Notice tone="error">{error}</Notice>}
        {message && <Notice tone="ok">{message}</Notice>}

        <div className="grid gap-8 lg:grid-cols-[1.35fr_1fr]">
          {/* ── TOPIC SELECTOR ── */}
          <section className="sheet sheet-pad">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="section-title !mb-1"><span className="mono">01</span> Mark your topics</h2>
                <p className="mono text-xs muted">
                  tap once = <span className="text-[color:var(--red)]">weak</span> · twice = <span className="text-[color:var(--green)]">strong</span> · thrice = clear
                </p>
              </div>
              <div className="flex items-center gap-3">
                {(weakCount > 0 || strongCount > 0) && (
                  <span className="mono text-xs">
                    {weakCount > 0 && <span className="text-[color:var(--red)]">{weakCount} weak</span>}
                    {weakCount > 0 && strongCount > 0 && " · "}
                    {strongCount > 0 && <span className="text-[color:var(--green)]">{strongCount} strong</span>}
                  </span>
                )}
                <button type="button" onClick={clearAllTopics} className="btn btn-sm">
                  Clear
                </button>
              </div>
            </div>

            <p className="field-label">DSA</p>
            <div className="mb-6 flex flex-wrap gap-2">
              {DSA_TOPICS.map((topic) => (
                <button key={topic} type="button" onClick={() => handleTopicClick(topic)} className={getChipClass(topic)}>
                  {topic}
                  {chipMark(topic)}
                </button>
              ))}
            </div>

            <p className="field-label">Core CS</p>
            <div className="flex flex-wrap gap-2">
              {CORE_TOPICS.map((topic) => (
                <button key={topic} type="button" onClick={() => handleTopicClick(topic)} className={getChipClass(topic)}>
                  {topic}
                  {chipMark(topic)}
                </button>
              ))}
            </div>
          </section>

          {/* ── ROADMAP FORM ── */}
          <form onSubmit={generate} className="sheet taped sheet-pad space-y-5 lg:self-start">
            <h2 className="section-title !mb-2"><span className="mono">02</span> The details</h2>

            <div>
              <label htmlFor="rm-company" className="field-label">Target company</label>
              <select
                id="rm-company"
                value={form.companySlug}
                onChange={(e) => setForm({ ...form, companySlug: e.target.value })}
                className="field"
              >
                <option value="">General (no specific company)</option>
                {companies.map((c) => (
                  <option key={c._id} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="rm-role" className="field-label">Role</label>
              <input
                id="rm-role"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                placeholder="SDE Intern"
                className="field"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="rm-weeks" className="field-label">Weeks</label>
                <input
                  id="rm-weeks"
                  type="number"
                  min={2}
                  max={24}
                  value={form.weeks}
                  onChange={(e) => setForm({ ...form, weeks: e.target.value })}
                  className="field"
                />
              </div>
              <div>
                <label htmlFor="rm-hours" className="field-label">Hours / day</label>
                <input
                  id="rm-hours"
                  type="number"
                  min={1}
                  max={12}
                  value={form.hoursPerDay}
                  onChange={(e) => setForm({ ...form, hoursPerDay: e.target.value })}
                  className="field"
                />
              </div>
            </div>

            {(weakCount > 0 || strongCount > 0) && (
              <div className="postit text-sm">
                {weakCount > 0 && (
                  <p><b>Weak:</b> {getWeakTopics().join(", ")}</p>
                )}
                {strongCount > 0 && (
                  <p className="mt-1"><b>Strong:</b> {getStrongTopics().join(", ")}</p>
                )}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn btn-ink btn-block">
              {loading ? "Drafting your plan…" : <>Generate roadmap <span className="arrow">→</span></>}
            </button>
          </form>
        </div>

        {loading && <Loader label="Drafting your plan, week by week" />}

        {/* ── ROADMAP OUTPUT ── */}
        {roadmap && (
          <section className="space-y-8 border-t-[1.5px] border-dashed border-[color:var(--ink)] pt-10">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <span className="kicker"><b>§</b> your roadmap</span>
                <h2 className="mt-2 text-4xl font-extrabold tracking-tight">
                  {roadmap.meta.company} <span className="serif italic">· {roadmap.meta.role}</span>
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className={roadmap.source === "gemini" ? "stamp stamp-green" : "stamp stamp-blue"}>
                  {roadmap.source === "gemini" ? "AI drafted" : "Template"}
                </span>
                <button onClick={saveToTracker} disabled={saving} className="btn btn-hi">
                  {saving ? "Saving…" : "Save to tracker"}
                </button>
              </div>
            </div>

            {/* checklist — 3-state toggle: todo → in-progress → done */}
            <div className="sheet sheet-pad">
              <p className="field-label">Topic checklist · tap to cycle</p>
              <div className="flex flex-wrap gap-2">
                {roadmap.checklist.map((item) => (
                  <button
                    key={item.topic}
                    type="button"
                    onClick={() => cycleState(item.topic)}
                    className={checklistTag(item.state)}
                  >
                    {item.topic}
                    <span className="mark">{item.state === "done" ? "✓" : item.state === "in-progress" ? "…" : "○"}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* weekly plan cards */}
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {roadmap.weeklyPlan.map((w, i) => (
                <article key={w.week} className="sheet sheet-pad rise" style={{ "--i": i % 9 }}>
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="text-2xl font-extrabold">Week <span className="circled">{w.week}</span></h3>
                  </div>
                  <p className="mt-3 text-sm">
                    <span className="hl font-semibold">{w.focus.join(" + ")}</span>
                  </p>
                  <ul className="mt-4 list-none space-y-2 p-0 text-sm">
                    {w.tasks.map((t, ti) => (
                      <li key={ti} className="flex gap-2">
                        <span className="text-[color:var(--red)]">—</span>
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>

            <div className="flex justify-end">
              <button onClick={saveToTracker} disabled={saving} className="btn btn-hi">
                {saving ? "Saving…" : "Save roadmap to tracker"}
              </button>
            </div>
          </section>
        )}
      </div>
    </PageShell>
  );
}

export default RoadmapGenerator;
