import { useState } from "react";
import { Link, useNavigate } from "react-router-dom"; //useNavigate hook se successful login ke baad user ko programmatically "/dashboard" par bhej dete hain.
import api from "../services/api";
import { useAuth } from "../context/useAuth";
import AuthLayout from "../components/AuthLayout";
import { Notice } from "../components/Bits";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" }); //form state: jab user input karega to handleChange ke through update hota rahega.
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value }); //...form purana data copy karta hai, aur [e.target.name] us specific field ko update karta hai.
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); //form submit par page reload nahi hona chahiye
    setError("");

    if (!form.email || !form.password) {
      setError("Please fill all fields");
      return;
    }

    try {
      setLoading(true);
      const res = await api.post("/auth/login", form);
      login(res.data);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      kicker="back to the books"
      title={
        <>
          Welcome <span className="serif">back.</span>
        </>
      }
      aside={
        <div className="postit max-w-sm">
          <p className="hand text-2xl leading-snug">
            Your roadmap, streak and checklist are right where you left them.
            <br />
            (Yes, including the DP you skipped.)
          </p>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="sheet taped sheet-pad space-y-5">
        <div className="flex items-end justify-between gap-4 border-b border-dashed border-[color:var(--ink-3)] pb-4">
          <div>
            <p className="kicker">Sign in</p>
            <h2 className="mt-1 text-3xl font-extrabold">Log in</h2>
          </div>
          <Link to="/register" className="link-ink text-sm">New here? Register</Link>
        </div>

        {error && <Notice tone="error">{error}</Notice>}

        <div>
          <label htmlFor="login-email" className="field-label">College email</label>
          <input
            id="login-email"
            type="email"
            name="email"
            autoComplete="email"
            placeholder="you@nie.ac.in"
            value={form.email}
            onChange={handleChange}
            className="field"
          />
        </div>

        <div>
          <label htmlFor="login-password" className="field-label">Password</label>
          <input
            id="login-password"
            type="password"
            name="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={form.password}
            onChange={handleChange}
            className="field"
          />
        </div>

        <button type="submit" disabled={loading} className="btn btn-ink btn-block !mt-7">
          {loading ? "Signing in…" : <>Open my notebook <span className="arrow">→</span></>}
        </button>

        <p className="mono text-center text-xs faint">only @nie.ac.in students can join for now</p>
      </form>
    </AuthLayout>
  );
}

export default Login;
