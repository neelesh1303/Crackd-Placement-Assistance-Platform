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
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-900 to-indigo-100 px-4 py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center space-y-6">
        <section className="w-full max-w-4xl rounded-2xl border border-sky-100 bg-white/90 p-6 shadow-sm">
          <h1 className="text-3xl font-bold text-slate-900">📊 Crackd</h1>
          <p className="mt-2 text-slate-600">Where preparation meets opportunity</p>
        </section>

        <form onSubmit={handleSubmit} className="w-full max-w-md rounded-xl border border-sky-100 bg-white p-6 shadow-md">
          <h2 className="mb-6 text-center text-2xl font-bold text-slate-900">Register</h2>
          <div className="mb-5 grid grid-cols-2 rounded-lg bg-slate-100 p-1">
  <Link
    to="/login"
    className="rounded-md px-3 py-2 text-center text-sm font-semibold text-gray-600 hover:bg-white"
  >
    Login
  </Link>
  <Link
    to="/register"
    className="rounded-md bg-emerald-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm"
  >
    Register
  </Link>
</div>

        {error && <p className="mb-4 text-red-600 text-sm">{error}</p>}

        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-slate-700">Name</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-emerald-500"
          />
        </div>

        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-emerald-500"
          />
        </div>

        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-emerald-500"
          />
        </div>

        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-slate-700">Branch</label>
          <input
            type="text"
            name="branch"
            value={form.branch}
            onChange={handleChange}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-emerald-500"
          />
        </div>

        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-slate-700">Year</label>
          <input
            type="number"
            name="year"
            value={form.year}
            onChange={handleChange}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-emerald-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-emerald-600 py-2 text-white hover:bg-emerald-700"
        >
          {loading ? "Registering..." : "Register"}
        </button>
        </form>
      </div>
    </div>
  );
}

export default Register;