import { useState } from "react";
import { Link, useNavigate } from "react-router-dom"; //useNavigate hook React Router v6 ka feature hai, jo hume programmatically navigate karne ki suvidha deta hai. jab user successful login karega, to hum useNavigate hook ka use karke user ko "/dashboard" route par redirect kar denge. isse user ko manually dashboard URL type karne ki zarurat nahi padegi, aur better user experience milega.
// import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" }); //useState hook to manage form state. initially email and password are empty strings. jab user input karega to handleChange function ke through form state update hota rahega.
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value }); //...form purana data copy kar raha hai, aur [e.target.name]: e.target.value us specific field ko update kar raha hai. isse hum easily multiple input fields ke liye ek hi handleChange function use kar sakte hain, bas input field ke name attribute ko form state ke key ke naam se match karna hoga.
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); //form submit hone par page reload nahi hona chahiye, isliye preventDefault ka use karte hain. otherwise form submit hone par page reload ho jayega, aur humara React state reset ho jayega, jo ki hum nahi chahte.
    setError(""); //jab bhi user submit kare, to pehle error message clear kar denge, taki agar pehle koi error tha to wo naya submit hone par dikhai na de.

    if (!form.email || !form.password) {
      setError("Please fill all fields");
      return;
    }

    try {
      setLoading(true); //jab login process start hota hai to loading true kar denge, taki button disable ho jaye aur user ko pata chale ki login ho raha hai. jab login process complete ho jayega, chahe successful ho ya error aaye, to finally block me loading false kar denge, taki button wapas enable ho jaye.
      const res = await api.post("/auth/login", form);
      login(res.data);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed"); //agar backend se error message aata hai to usse set karenge, otherwise "Login failed" message set karenge. err.response?.data?.message is using optional chaining to safely access nested properties of the error object, in case any of them are undefined.
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(16,185,129,0.14),_transparent_24%),linear-gradient(180deg,_#0f172a,_#1e293b)] text-white">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center px-4 py-12 lg:px-8">
        <div className="grid w-full gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[2rem] border border-white/10 bg-white/5 p-10 shadow-[0_32px_90px_rgba(15,23,42,0.24)] backdrop-blur-xl glass-card fade-up">
            <span className="inline-flex rounded-full bg-sky-500/15 px-4 py-2 text-sm font-semibold text-sky-200 shadow-sm">
              Fast. Clean. Focused.
            </span>
            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
              Welcome back to Crackd.
            </h1>
            <p className="mt-4 max-w-xl text-slate-300 leading-8">
              Get access to your preparation dashboard, company insights, roadmap generator, and progress tracker in one polished workspace.
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-slate-900/70 p-5 ring-1 ring-white/10 transition hover:-translate-y-1 hover:bg-slate-900/80">
                <p className="text-sm text-sky-200">Quick access</p>
                <p className="mt-2 text-lg font-semibold text-white">Focus on what matters</p>
              </div>
              <div className="rounded-3xl bg-slate-900/70 p-5 ring-1 ring-white/10 transition hover:-translate-y-1 hover:bg-slate-900/80">
                <p className="text-sm text-emerald-200">Secure login</p>
                <p className="mt-2 text-lg font-semibold text-white">Keep your data safe</p>
              </div>
            </div>
          </section>

          <form onSubmit={handleSubmit} className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/95 p-8 shadow-[0_32px_90px_rgba(15,23,42,0.24)] backdrop-blur-xl fade-up">
            <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-[radial-gradient(circle,_rgba(96,165,250,0.3),_transparent_80%)]" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-[radial-gradient(circle,_rgba(16,185,129,0.18),_transparent_55%)]" />

            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-300">Sign in</p>
                <h2 className="text-3xl font-bold text-white">Login to your account</h2>
              </div>
              <Link
                to="/register"
                className="rounded-full border border-slate-700 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
              >
                Register
              </Link>
            </div>

            {error && <p className="mb-4 rounded-2xl bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}

            <div className="space-y-5">
              <label className="block text-sm font-medium text-slate-300">
                Email address
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-3xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-white outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
                />
              </label>

              <label className="block text-sm font-medium text-slate-300">
                Password
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-3xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-white outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-8 w-full rounded-3xl bg-gradient-to-r from-sky-500 to-cyan-400 px-6 py-3 text-base font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Log in"}
            </button>

            <p className="mt-6 text-center text-sm text-slate-500">
              Only @nie.ac.in students can join for now.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;