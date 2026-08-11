import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(16,185,129,0.12),_transparent_24%),radial-gradient(circle_at_bottom_left,_rgba(234,179,8,0.14),_transparent_24%),linear-gradient(180deg,_#f8fafc,_#e2e8f0)] text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-6 py-10 lg:px-8">
        <div className="mb-14 grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <section className="space-y-6 rounded-[2rem] border border-slate-200 bg-white/90 p-10 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl">
            <span className="inline-flex rounded-full bg-sky-100 px-4 py-1 text-sm font-semibold text-sky-700">
              Build your placement preparation strategy
            </span>
            <div className="space-y-4">
              <h1 className="page-title text-slate-950">Crackd — your guided placement prep hub</h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-600">
                Generate targeted study roadmaps, save progress, and explore real interview experience data from top companies. Designed for students who want a clean, smart preparation workflow.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link to="/login" className="btn-primary">
                Login to get started
              </Link>
              <Link to="/register" className="btn-secondary">
                Create account
              </Link>
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-slate-950/95 p-8 text-white shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
            <div className="mb-5 flex items-center justify-between rounded-3xl bg-slate-900/90 p-4">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-sky-300">What you can do</p>
              </div>
              <div className="rounded-2xl bg-slate-800 px-3 py-2 text-xs text-slate-200">
                Live-ready</div>
            </div>
            <ul className="space-y-4 text-sm leading-7">
              <li className="rounded-2xl bg-slate-800/80 p-4">
                <span className="font-semibold text-slate-100">Personalized Roadmaps</span>
                <p className="mt-2 text-slate-400">Generate a tailored weekly plan for your target company, role, and topics.</p>
              </li>
              <li className="rounded-2xl bg-slate-800/80 p-4">
                <span className="font-semibold text-slate-100">Progress Tracker</span>
                <p className="mt-2 text-slate-400">Save your roadmap and convert it into a checklist with streak tracking.</p>
              </li>
              <li className="rounded-2xl bg-slate-800/80 p-4">
                <span className="font-semibold text-slate-100">Company Experience Insights</span>
                <p className="mt-2 text-slate-400">Explore real interview experiences and company-specific preparation cues.</p>
              </li>
            </ul>
          </section>
        </div>

        <section className="grid gap-6 rounded-[2rem] border border-slate-200 bg-white/90 p-10 shadow-[0_24px_80px_rgba(15,23,42,0.08)] lg:grid-cols-3">
          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-slate-900">Why Crackd?</h2>
            <p className="text-slate-600">A simple student-first platform to convert messy prep plans into trackable action.</p>
          </div>
          <div className="space-y-3 rounded-[1.75rem] bg-slate-50 p-6">
            <p className="text-sm uppercase tracking-[0.22em] text-sky-700">Roadmap</p>
            <p className="text-slate-700">Select weak topics, choose your target role, and generate a guided study schedule in seconds.</p>
          </div>
          <div className="space-y-3 rounded-[1.75rem] bg-slate-50 p-6">
            <p className="text-sm uppercase tracking-[0.22em] text-sky-700">Tracker</p>
            <p className="text-slate-700">Save your weekly plan, update checklist status, and keep streaks alive as you practice.</p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;
