import { Link } from "react-router-dom";
import Logo from "../components/Logo";

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

const Home = () => {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 lg:px-8">
        <Logo />
        <div className="flex items-center gap-4">
          <Link to="/login" className="link-ink text-sm">Log in</Link>
          <Link to="/register" className="btn btn-sm btn-hi hidden sm:inline-flex">Get started</Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 lg:px-8">
        <section className="home-hero">
          <div className="rise">
            <span className="kicker"><b>§00</b> placement season survival kit</span>
            <h1 className="display mt-6">
              Crack the <span className="hl">interview</span>,
              <br />
              not your <span className="serif">head.</span>
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
                <span className="stamp">week 06</span>
              </div>
              <p className="stat-num mt-5">
                <span className="circled">78</span>
                <span className="serif text-4xl italic">%</span>
              </p>
              <p className="muted mt-2 text-sm">of your checklist is actually done</p>
              <div className="meter mt-4"><div className="meter-fill" style={{ width: "78%" }} /></div>
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
              <p className="kicker mb-2">today</p>
              <ul className="m-0 list-none p-0">
                <li><span className="struck">watch another "roadmap" video</span></li>
                <li><span className="struck">bookmark 40 DSA sheets</span></li>
                <li className="done">solve 3 graph problems</li>
                <li>read seniors' OA notes</li>
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
            <span className="kicker"><b>§</b> contents</span>
            <h2 className="mt-4 text-5xl font-extrabold leading-none tracking-tighter">
              What's in the <span className="serif italic">notebook</span>
            </h2>
            <p className="mt-5 max-w-sm muted">
              Five sections. No feeds, no fluff. Open the one you need and get back to solving.
            </p>
          </div>
          <div className="border-t-[1.5px] border-[color:var(--ink)]">
            {CONTENTS.map((item) => (
              <Link key={item.no} to={item.to} className="index-row">
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
