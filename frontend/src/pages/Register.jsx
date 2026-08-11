import { useState } from "react";
import { Link, useNavigate } from "react-router-dom"; //useNavigate hook React Router v6 ka feature hai, jo hume programmatically navigate karne ki suvidha deta hai. jab user successful login karega, to hum useNavigate hook ka use karke user ko "/dashboard" route par redirect kar denge. isse user ko manually dashboard URL type karne ki zarurat nahi padegi, aur better user experience milega.
// import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    branch: "",
    year: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.name || !form.email || !form.password || !form.branch || !form.year) {
      setError("Please fill all fields");
      return;
    }

    if (!form.email.endsWith("@nie.ac.in")) {
      setError("Only @nie.ac.in college emails are allowed");
      return;
    }

    try {
      setLoading(true);
      const payload = { ...form, year: Number(form.year) };
      const res = await api.post("/auth/register", payload); //jab user register karega to uska data payload me jayega, jisme form ke saare fields honge. year field ko number me convert kar denge, kyunki backend me year field number type ka hai. agar hum string bhejenge to backend me validation error aayega. isliye year field ko Number() function se convert kar ke bhej rahe hain.
      login(res.data);
      navigate("/dashboard");
    } catch (err) {
      console.error("register error", err);
      setError(
        err.response?.data?.message || err.message || "Registration failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.15),_transparent_22%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.18),_transparent_24%),linear-gradient(180deg,_#0f172a,_#111827)] text-white">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center px-4 py-10 lg:px-8">
        <div className="grid w-full gap-10 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="rounded-[2rem] border border-white/10 bg-white/5 p-10 shadow-[0_32px_90px_rgba(15,23,42,0.24)] backdrop-blur-xl glass-card fade-up">
            <span className="inline-flex rounded-full bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-200 shadow-sm">
              Join the placement hub
            </span>
            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
              Create your Crackd account.
            </h1>
            <p className="mt-4 max-w-xl text-slate-300 leading-8">
              Register with your college email to unlock AI roadmaps, experience sharing, and progress tracking from one dashboard.
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-slate-900/70 p-5 ring-1 ring-white/10 transition hover:-translate-y-1 hover:bg-slate-900/80">
                <p className="text-sm text-emerald-200">Roadmap generator</p>
                <p className="mt-2 text-lg font-semibold text-white">Plan your study path</p>
              </div>
              <div className="rounded-3xl bg-slate-900/70 p-5 ring-1 ring-white/10 transition hover:-translate-y-1 hover:bg-slate-900/80">
                <p className="text-sm text-sky-200">Progress tracking</p>
                <p className="mt-2 text-lg font-semibold text-white">Keep your streak alive</p>
              </div>
            </div>
          </section>

          <form onSubmit={handleSubmit} className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/95 p-8 shadow-[0_32px_90px_rgba(15,23,42,0.24)] backdrop-blur-xl fade-up">
            <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-[radial-gradient(circle,_rgba(16,185,129,0.3),_transparent_80%)]" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-[radial-gradient(circle,_rgba(59,130,246,0.18),_transparent_55%)]" />

            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-300">Create account</p>
                <h2 className="text-3xl font-bold text-white">Register now</h2>
              </div>
              <Link
                to="/login"
                className="rounded-full border border-slate-700 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
              >
                Already a member?
              </Link>
            </div>

            {error && <p className="mb-4 rounded-2xl bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}

            <div className="space-y-5">
              <label className="block text-sm font-medium text-slate-300">
                Full name
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-3xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-white outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
                />
              </label>

              <label className="block text-sm font-medium text-slate-300">
                College email
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-3xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-white outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
                />
              </label>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block text-sm font-medium text-slate-300">
                  Password
                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    className="mt-2 w-full rounded-3xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-white outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
                  />
                </label>

                <label className="block text-sm font-medium text-slate-300">
                  Branch
                  <input
                    type="text"
                    name="branch"
                    value={form.branch}
                    onChange={handleChange}
                    className="mt-2 w-full rounded-3xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-white outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
                  />
                </label>
              </div>

              <label className="block text-sm font-medium text-slate-300">
                Year
                <input
                  type="number"
                  name="year"
                  value={form.year}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-3xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-white outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-8 w-full rounded-3xl bg-gradient-to-r from-emerald-400 to-teal-500 px-6 py-3 text-base font-semibold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing up..." : "Create account"}
            </button>

            <p className="mt-6 text-center text-sm text-slate-500">
              Use your official NIE email to register and access the full prep suite.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Register;