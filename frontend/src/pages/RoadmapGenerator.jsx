//is page ka kaam hai AI Roadmap Generator ko implement karna, jisme user apne target company aur role ke hisab se personalized study plan generate kar sakta hai. is page par ek form diya gaya hai jisme user apne target company, role, preparation duration (weeks), daily study hours, weak topics, aur strong topics input kar sakta hai. jab user form submit karta hai to ye data backend ke /api/roadmap/generate endpoint par bheja jata hai, jahan se AI ke dwara customized roadmap generate hota hai. generated roadmap me weekly study plan aur topic checklist hoti hai, jise user apne progress ke hisab se manage kar sakta hai. user roadmap ko tracker me save bhi kar sakta hai, taki wo apne placement preparation ke progress ko effectively track kar sake.

import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../services/api";

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
      setError(err.response?.data?.message || "Roadmap generation failed");
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

  // topic chip ka color decide karta hai uske current state ke hisab se
  // weak = lal, strong = hara, unselected = grey
  const getChipStyle = (topic) => {
    const state = topicMap[topic];
    if (state === "weak")
      return "bg-red-100 text-red-700 border border-red-300 font-semibold";
    if (state === "strong")
      return "bg-emerald-100 text-emerald-700 border border-emerald-300 font-semibold";
    return "bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200";
  };

  // selected weak aur strong topics ki count — summary me dikhate hain
  const weakCount = getWeakTopics().length;
  const strongCount = getStrongTopics().length;

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
          >
            Dashboard
          </button>
          <button
            type="button"
            onClick={() => navigate("/roadmap")}
            className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
          >
            Roadmap
          </button>
          <button
            type="button"
            onClick={() => navigate("/progress")}
            className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
          >
            Progress Tracker
          </button>
          <button
            type="button"
            onClick={() => navigate("/companies")}
            className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
          >
            Companies
          </button>
        </div>

        <h1 className="mb-2 text-3xl font-bold text-slate-900">AI Roadmap Generator</h1>
        <p className="mb-6 text-slate-600">
           Select Topics then Generate a Personalized Roadmap 
        </p>

        {error && <p className="mb-3 rounded bg-red-50 p-3 text-red-700">{error}</p>}
        {message && <p className="mb-3 rounded bg-emerald-50 p-3 text-emerald-700">{message}</p>}

        {/* ── TOPIC SELECTOR SECTION ── */}
        {/* ye section form ke upar dikhta hai — user yahan apne weak/strong topics mark karta hai */}
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

          {/* legend + clear button */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Select Topics</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                1 click = Weak  &nbsp;|&nbsp; 2 clicks = Strong  &nbsp;|&nbsp; 3 clicks = Unselect
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* selected topics ka quick summary */}
              {(weakCount > 0 || strongCount > 0) && (
                <span className="text-xs text-slate-500">
                  {weakCount > 0 && <span className="text-red-600 font-medium">{weakCount} weak</span>}
                  {weakCount > 0 && strongCount > 0 && " · "}
                  {strongCount > 0 && <span className="text-emerald-600 font-medium">{strongCount} strong</span>}
                </span>
              )}
              <button
                type="button"
                onClick={clearAllTopics}
                className="rounded-md border border-slate-200 px-3 py-1 text-xs text-slate-500 hover:bg-slate-50"
              >
                Clear All
              </button>
            </div>
          </div>

          {/* DSA topics group */}
          <div className="mb-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              DSA Topics
            </p>
            <div className="flex flex-wrap gap-2">
              {DSA_TOPICS.map((topic) => (
                <button
                  key={topic}
                  type="button"
                  onClick={() => handleTopicClick(topic)}
                  className={`rounded-full px-3 py-1 text-xs transition-all cursor-pointer ${getChipStyle(topic)}`}
                >
                  {topic}
                  {/* agar topic selected hai to uska label bhi chip pe dikhao */}
                  {topicMap[topic] === "weak" && " ✗"}
                  {topicMap[topic] === "strong" && " ✓"}
                </button>
              ))}
            </div>
          </div>

          {/* Core CS topics group */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Core CS Concepts
            </p>
            <div className="flex flex-wrap gap-2">
              {CORE_TOPICS.map((topic) => (
                <button
                  key={topic}
                  type="button"
                  onClick={() => handleTopicClick(topic)}
                  className={`rounded-full px-3 py-1 text-xs transition-all cursor-pointer ${getChipStyle(topic)}`}
                >
                  {topic}
                  {topicMap[topic] === "weak" && " ✗"}
                  {topicMap[topic] === "strong" && " ✓"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── ROADMAP FORM ── */}
        {/* basic config: company, role, weeks, hours */}
        <form
          onSubmit={generate}
          className="mb-8 grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2"
        >
          {/* company dropdown — backend se fetch kiya hua data */}
          <select
            value={form.companySlug}
            onChange={(e) => setForm({ ...form, companySlug: e.target.value })}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
          >
            <option value="">General (No Specific Company)</option>
            {companies.map((c) => (
              <option key={c._id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>

          <input
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            placeholder="Role (e.g. SDE Intern)"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
          />

          <input
            type="number"
            min={2}
            max={24}
            value={form.weeks}
            onChange={(e) => setForm({ ...form, weeks: e.target.value })}
            placeholder="Weeks"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
          />

          <input
            type="number"
            min={1}
            max={12}
            value={form.hoursPerDay}
            onChange={(e) => setForm({ ...form, hoursPerDay: e.target.value })}
            placeholder="Hours/day"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
          />

          {/* selected topics ka preview — form ke andar confirm karne ke liye */}
          {(weakCount > 0 || strongCount > 0) && (
            <div className="md:col-span-2 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-600">
              {weakCount > 0 && (
                <p>
                  <span className="font-medium text-red-600">Weak:</span>{" "}
                  {getWeakTopics().join(", ")}
                </p>
              )}
              {strongCount > 0 && (
                <p className="mt-0.5">
                  <span className="font-medium text-emerald-600">Strong:</span>{" "}
                  {getStrongTopics().join(", ")}
                </p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-800 disabled:opacity-60 md:col-span-2"
          >
            {loading ? "Generating..." : "Generate Roadmap"}
          </button>
        </form>

        {/* ── ROADMAP OUTPUT ── */}
        {/* roadmap generate hone ke baad yahan weekly plan aur checklist dikhata hai */}
        {roadmap && (
          <div className="space-y-4">

            {/* roadmap meta info — source, company, role */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-700">
                Source:{" "}
                <span
                  className={`font-semibold ${
                    roadmap.source === "huggingface"
                      ? "text-emerald-600"
                      : "text-amber-600"
                  }`}
                >
                  {roadmap.source === "huggingface" ? "AI Generated ✓" : "Fallback (Template)"}
                </span>{" "}
                | Company:{" "}
                <span className="font-semibold">{roadmap.meta.company}</span> | Role:{" "}
                <span className="font-semibold">{roadmap.meta.role}</span>
              </p>
            </div>

            {/* checklist — 3-state toggle: todo → in-progress → done */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-lg font-semibold text-slate-900">
                Topic Checklist
              </h2>
              <div className="flex flex-wrap gap-2">
                {roadmap.checklist.map((item) => (
                  <button
                    key={item.topic}
                    type="button"
                    onClick={() => cycleState(item.topic)}
                    className={
                      "rounded-full px-3 py-1 text-xs font-medium transition-all " +
                      (item.state === "done"
                        ? "bg-emerald-100 text-emerald-700"
                        : item.state === "in-progress"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-slate-100 text-slate-700")
                    }
                  >
                    {item.topic} ({item.state})
                  </button>
                ))}
              </div>
            </div>

            {/* weekly plan cards — har week ka focus aur tasks */}
            {roadmap.weeklyPlan.map((w) => (
              <div
                key={w.week}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <h3 className="mb-2 text-lg font-semibold text-slate-900">
                  Week {w.week}
                </h3>
                <p className="mb-2 text-sm text-slate-700">
                  Focus: <span className="font-medium">{w.focus.join(" + ")}</span>
                </p>
                <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
                  {w.tasks.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              </div>
            ))}

            {/* tracker me save karne ka button */}
            <button
              onClick={saveToTracker}
              disabled={saving}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Roadmap to Tracker"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default RoadmapGenerator;