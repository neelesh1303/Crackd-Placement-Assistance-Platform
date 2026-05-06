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
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-900 to-indigo-100 px-4 py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center space-y-6">
        <section className="w-full max-w-4xl rounded-2xl border border-sky-100 bg-white/90 p-6 shadow-sm">
          <h1 className="text-3xl font-bold text-slate-900">📊 Crackd</h1>
          <p className="mt-2 text-slate-600">Where preparation meets opportunity</p>
        </section>

        <form onSubmit={handleSubmit} className="w-full max-w-md rounded-xl border border-sky-100 bg-white p-6 shadow-md">
          <h2 className="mb-6 text-center text-2xl font-bold text-slate-900">Login</h2>
          <div className="mb-5 grid grid-cols-2 rounded-lg bg-slate-100 p-1">
  <Link
    to="/login"
    className="rounded-md bg-blue-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm"
  >
    Login
  </Link>
  <Link
    to="/register"
    className="rounded-md px-3 py-2 text-center text-sm font-semibold text-slate-600 hover:bg-white"
  >
    Register
  </Link>
</div>

        {error && <p className="mb-4 text-red-600 text-sm">{error}</p>}

        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
          <input
            type="email" //email type input field, jisme browser automatically email format validate karta hai. agar user invalid email format me input karta hai to form submit nahi hoga, aur browser error message show karega. isse hume manually email validation karne ki zarurat nahi padegi.
            name="email"
            value={form.email}
            onChange={handleChange}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500"
          />
        </div>

        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
          <input
            type="password" //password type input field, jisme user ke input ko dots me show kiya jata hai, taki koi aur uska password na dekh sake. isse security badh jati hai, kyunki password directly visible nahi hota.
            name="password"
            value={form.password}
            onChange={handleChange}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading} //jab loading true hoga to button disable ho jayega, taki user multiple times submit na kar sake jab login process chal raha ho.
          className="w-full rounded-lg bg-slate-900 py-2 text-white hover:bg-slate-800"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
        </form>
      </div>
    </div>
  );
}

export default Login;