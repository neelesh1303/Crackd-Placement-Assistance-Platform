import { useState } from "react";
import { Link, useNavigate } from "react-router-dom"; //useNavigate hook se register ke baad user ko "/dashboard" par bhej dete hain.
import api from "../services/api";
import { useAuth } from "../context/useAuth";
import AuthLayout from "../components/AuthLayout";
import { Notice } from "../components/Bits";

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
      const res = await api.post("/auth/register", payload); //year ko Number me convert karte hain kyunki backend me year number type ka hai.
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
    <AuthLayout
      kicker="new notebook"
      title={
        <>
          Start <span className="hl">fresh</span>. <span className="serif">Prep smart.</span>
        </>
      }
      aside={
        <ul className="max-w-md space-y-4">
          {[
            ["01", "Read what seniors were actually asked"],
            ["02", "Get a roadmap built around your weak topics"],
            ["03", "Track it until the readiness meter fills up"],
          ].map(([no, text]) => (
            <li key={no} className="flex items-baseline gap-4 border-b border-dashed border-[color:var(--ink-3)] pb-3">
              <span className="mono text-sm text-[color:var(--red)]">{no}</span>
              <span className="text-lg font-semibold">{text}</span>
            </li>
          ))}
        </ul>
      }
    >
      <form onSubmit={handleSubmit} className="sheet taped sheet-pad space-y-5">
        <div className="flex items-end justify-between gap-4 border-b border-dashed border-[color:var(--ink-3)] pb-4">
          <div>
            <p className="kicker">Create account</p>
            <h2 className="mt-1 text-3xl font-extrabold">Register</h2>
          </div>
          <Link to="/login" className="link-ink text-sm">Already a member?</Link>
        </div>

        {error && <Notice tone="error">{error}</Notice>}

        <div>
          <label htmlFor="reg-name" className="field-label">Full name</label>
          <input id="reg-name" type="text" name="name" autoComplete="name" value={form.name} onChange={handleChange} className="field" />
        </div>

        <div>
          <label htmlFor="reg-email" className="field-label">College email</label>
          <input id="reg-email" type="email" name="email" autoComplete="email" placeholder="you@nie.ac.in" value={form.email} onChange={handleChange} className="field" />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="reg-password" className="field-label">Password</label>
            <input id="reg-password" type="password" name="password" autoComplete="new-password" value={form.password} onChange={handleChange} className="field" />
          </div>
          <div>
            <label htmlFor="reg-branch" className="field-label">Branch</label>
            <input id="reg-branch" type="text" name="branch" placeholder="CSE" value={form.branch} onChange={handleChange} className="field" />
          </div>
        </div>

        <div>
          <label htmlFor="reg-year" className="field-label">Year</label>
          <input id="reg-year" type="number" name="year" placeholder="3" value={form.year} onChange={handleChange} className="field" />
        </div>

        <button type="submit" disabled={loading} className="btn btn-ink btn-block !mt-7">
          {loading ? "Setting up your notebook…" : <>Create account <span className="arrow">→</span></>}
        </button>

        <p className="mono text-center text-xs faint">use your official NIE email</p>
      </form>
    </AuthLayout>
  );
}

export default Register;
