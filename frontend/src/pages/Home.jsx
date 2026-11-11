import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Logo from "../components/Logo";
import PencilTrail from "../components/PencilTrail";
import { useAuth } from "../context/useAuth";

const TOPICS = [
  "Arrays", "Sliding Window", "Binary Search", "Graphs", "Dynamic Programming", "DBMS",
  "Operating Systems", "Computer Networks", "OOP", "LLD", "SQL", "HR round",
];

const CONTENTS = [
  { no: "01", title: "Company files", body: "Who visited campus, what they asked, round by round.", to: "/companies" },
  { no: "02", title: "Roadmaps", body: "A week-by-week plan built around your weak spots.", to: "/roadmap" },
  { no: "03", title: "Progress", body: "Tick topics off. Watch the pencil shading fill up.", to: "/progress" },
  { no: "04", title: "Ask", body: "Questions answered from real interview experiences.", to: "/chat" },
  { no: "05", title: "Share your story", body: "Got through? Write down what they asked you.", to: "/add-experience" },
];

// Margin doodles that drift in the background. x/y are % of the hero, depth drives parallax.
const DOODLES = [
  { text: "O(n log n)", x: 4, y: 6, depth: 14, rot: -8 },
  { text: "dp[i][j] = ?", x: 44, y: 3, depth: -10, rot: 4 },
  { text: "two pointers!!", x: 50, y: 88, depth: 18, rot: -5 },
  { text: "while (lo <= hi)", x: 2, y: 92, depth: -14, rot: 3 },
  { svg: "tree", x: 48, y: 44, depth: 22, rot: 0 },
  { svg: "star", x: 92, y: 4, depth: -18, rot: 0 },
  { svg: "arrow", x: 56, y: 22, depth: 12, rot: 0 },
  { svg: "star", x: 30, y: 80, depth: 10, rot: 20 },
];

const DoodleSvg = ({ kind }) => {
  if (kind === "tree") {
    return (
      <svg width="74" height="62" viewBox="0 0 74 62" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <circle cx="37" cy="9" r="7" /><circle cx="15" cy="35" r="7" /><circle cx="59" cy="35" r="7" /><circle cx="48" cy="55" r="5.5" />
        <path d="M32 14 L19 29 M42 14 L55 29 M56 41 L50 50" />
      </svg>
    );
  }
  if (kind === "arrow") {
    return (
      <svg width="86" height="40" viewBox="0 0 86 40" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M3 30 C 25 4, 52 4, 78 22" /><path d="M68 14 L79 22 L67 27" />
      </svg>
    );
  }
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M15 2 L15 28 M2 15 L28 15 M6 6 L24 24 M24 6 L6 24" />
    </svg>
  );
};

// counts up from 0 to `target` once on mount
function useCountUp(target, duration = 1400, delay = 500) {
  const [reduced] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [value, setValue] = useState(() => (reduced ? target : 0));
  useEffect(() => {
    if (reduced) return undefined;
    let raf = 0;
    const start = performance.now() + delay;
    const tick = (now) => {
      const p = Math.min(Math.max((now - start) / duration, 0), 1);
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, delay, reduced]);
  return value;
}

const INITIAL_TODOS = [
  { text: 'watch another "roadmap" video', done: true },
  { text: "bookmark 40 DSA sheets", done: true },
  { text: "solve 3 graph problems", done: false },
  { text: "read seniors' OA notes", done: false },
];

const Home = () => {
  const rootRef = useRef(null);
  const { token, user, logout } = useAuth();
  const isLoggedIn = Boolean(token && user); // server-verified session only
  const score = useCountUp(78);
  const [todos, setTodos] = useState(INITIAL_TODOS);
  const [touched, setTouched] = useState(false); // after the first click, strikes draw instantly

  // mouse position → CSS vars --mx / --my in [-1, 1], used for parallax
  useEffect(() => {
    const el = rootRef.current;
    if (!el || !window.matchMedia("(pointer: fine)").matches) return undefined;
    let raf = 0;
    const onMove = (event) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.setProperty("--mx", ((event.clientX / window.innerWidth) * 2 - 1).toFixed(3));
        el.style.setProperty("--my", ((event.clientY / window.innerHeight) * 2 - 1).toFixed(3));
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  const toggleTodo = (index) => {
    setTouched(true);
    setTodos((prev) => prev.map((todo, i) => (i === index ? { ...todo, done: !todo.done } : todo)));
  };

  return (
    <div ref={rootRef} className="home relative min-h-screen overflow-x-clip">
      <PencilTrail />

      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 lg:px-8">
        <Logo />
        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <>
              <button type="button" onClick={logout} className="link-ink text-sm">Log out</button>
              <Link to="/dashboard" className="btn btn-sm btn-hi hidden sm:inline-flex">Open dashboard</Link>
            </>
          ) : (
            <>
              <Link to="/login" className="link-ink text-sm">Log in</Link>
              <Link to="/register" className="btn btn-sm btn-hi hidden sm:inline-flex">Get started</Link>
            </>
          )}
        </div>
      </header>

      <main className="relative mx-auto max-w-7xl px-4 lg:px-8">
        <div className="doodles" aria-hidden="true">
          {DOODLES.map((d, i) => (
            <span
              key={i}
              className="doodle"
              style={{ left: `${d.x}%`, top: `${d.y}%`, "--depth": d.depth, "--rot": `${d.rot}deg`, "--float": `${7 + (i % 4) * 1.6}s`, "--delay": `${-i * 1.3}s` }}
            >
              {d.svg ? <DoodleSvg kind={d.svg} /> : d.text}
            </span>
          ))}
        </div>

        <section className="home-hero relative z-10">
          <div className="rise">
            <span className="kicker">placement season survival kit</span>
            <h1 className="display mt-6">
              Crack the <span className="hl hl-draw">interview</span>,
              <br />
              not your <span className="serif wobble">head.</span>
            </h1>
            <p className="mt-7 max-w-xl text-lg muted">
              Crackd is the prep notebook your seniors wish they'd had — real interview
              experiences from campus, a roadmap that knows what you're bad at, and a tracker
              that doesn't let you lie to yourself.
            </p>
            <div className="mt-9 flex flex-col items-start gap-5 sm:flex-row sm:items-center">
              <Link to="/register" className="btn btn-ink">
                Start your notebook <span className="arrow">→</span>
              </Link>
              <Link to="/login" className="link-ink">I already have one</Link>
            </div>
            <p className="hand mt-8 inline-block -rotate-2 text-2xl text-[color:var(--blue)]">
              ↑ free, for @nie.ac.in folks only
            </p>
          </div>

          <div className="desk rise" style={{ "--i": 2 }} aria-label="Preview of a Crackd prep notebook">
            <div className="report sheet taped sheet-pad">
              <div className="flex items-center justify-between">
                <span className="kicker">Readiness report</span>
                <span className="stamp stamp-thud">week 06</span>
              </div>
              <p className="stat-num mt-5">
                <span className="circled circled-draw">{score}</span>
                <span className="serif text-4xl italic">%</span>
              </p>
              <p className="muted mt-2 text-sm">of your checklist is actually done</p>
              <div className="meter mt-4"><div className="meter-fill meter-grow" style={{ width: "78%" }} /></div>
              <ul className="mt-5 space-y-2 text-sm">
                <li className="flex items-center gap-3"><span className="font-semibold">Graphs</span><span className="tag tag-green">done</span></li>
                <li className="flex items-center gap-3"><span className="font-semibold">Dynamic Programming</span><span className="tag tag-hi">on it</span></li>
                <li className="flex items-center gap-3"><span className="font-semibold">Operating Systems</span><span className="tag tag-ghost">to do</span></li>
              </ul>
            </div>

            <div className="note postit postit-pink">
              <p className="hand text-2xl">Day 7 of the streak. Not stopping now.</p>
            </div>

            <div className="todo sheet sheet-pad">
              <p className="kicker mb-2">today <span className="hand normal-case tracking-normal text-[color:var(--blue)]">— tap to tick</span></p>
              <ul className="m-0 list-none p-0">
                {todos.map((todo, i) => (
                  <li key={todo.text}>
                    <button
                      type="button"
                      onClick={() => toggleTodo(i)}
                      className={`todo-item ${todo.done ? "is-done" : ""}`}
                      style={{ "--d": touched ? "0ms" : `${1100 + i * 350}ms` }}
                      aria-pressed={todo.done}
                    >
                      <span className="todo-box" aria-hidden="true">{todo.done ? "✓" : ""}</span>
                      <span className="min-w-0"><span className="todo-text">{todo.text}</span></span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </main>


      <div className="marquee" aria-hidden="true">
        <div className="marquee-track">
          {[...TOPICS, ...TOPICS].map((topic, i) => (
            <span key={`${topic}-${i}`}>{topic}</span>
          ))}
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-4 py-20 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <span className="kicker">contents</span>
            <h2 className="mt-4 text-5xl font-extrabold leading-none tracking-tighter">
              What's in the <span className="serif italic">notebook</span>
            </h2>
            <p className="mt-5 max-w-sm muted">
              Five sections. No feeds, no fluff. Open the one you need and get back to solving.
            </p>
          </div>
          <div className="border-t-[1.5px] border-[color:var(--ink)]">
            {CONTENTS.map((item) => (
              <Link
                key={item.no}
                // Logged-out visitors go to login first, then land on the section they picked.
                to={isLoggedIn ? item.to : "/login"}
                state={isLoggedIn ? undefined : { from: { pathname: item.to } }}
                className="index-row"
              >
                <span className="num">{item.no}</span>
                <span>
                  <span className="block text-xl font-extrabold tracking-tight">{item.title}</span>
                  <span className="block text-sm muted">{item.body}</span>
                </span>
                <span className="text-xl" aria-hidden="true">→</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 lg:px-8">
        <div className="ink-panel flex flex-col items-start justify-between gap-8 p-8 sm:p-12 lg:flex-row lg:items-center">
          <h2 className="max-w-2xl text-4xl font-extrabold leading-none tracking-tighter sm:text-5xl">
            Placement season doesn't wait. <span className="serif italic text-[color:var(--hi)]">Neither should you.</span>
          </h2>
          <Link to="/register" className="btn btn-hi">
            Open your notebook <span className="arrow">→</span>
          </Link>
        </div>
      </section>

      <footer className="colophon">
        <span>crackd — written in pencil, revised in pen.</span>
        <span>made by students who also panicked before their first OA</span>
      </footer>
    </div>
  );
};

export default Home;
