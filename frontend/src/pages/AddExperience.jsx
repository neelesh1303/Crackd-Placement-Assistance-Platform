import { useState } from "react"; //to manage form state and other local states in the component
import { useNavigate } from "react-router-dom"; //to navigate bw pages
import api from "../services/api";
import RoundInput from "../components/RoundInput";
  // Fetch companies on mount
import { useEffect } from "react"; //to fetch list of companies from backend when component mounts, taki user experience create karte waqt company select kar sake. useEffect hook ke andar hum ek async function define karenge jo /companies endpoint se data fetch karega, aur usse companies state me set karega. ye companies state fir company select dropdown me use hogi.

function AddExperience() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); //useSate ka use hm tb krte hai jb hm koi data initially store krte hai and data update hone pe hme ui update krke dikhana hota hai
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    company: "",
    role: "",
    year: "",
    ctc: "",
    cgpaCutoff: "",
    rounds: [
      {
        roundNo: 1,
        type: "OA",
        description: "",
        problemsAsked: [],
        topics: [],
        duration: "",
      },
    ],
    tips: "",
    resources: "",
    gotOffer: false,
    prepTime: "",
  });

  const [companies, setCompanies] = useState([]); //companies state to store list of companies fetched from backend. initially empty array. jab data fetch hota hai to usse setCompanies function ke through update kar denge, taki wo company select dropdown me dikhai de.



  useEffect(() => {
    const fetchCompanies = async () => { //is function ka use hm companies data fetch karne ke liye karenge, taki user experience create karte waqt company select kar sake. ye function /companies endpoint se data fetch karega, aur usse companies state me set karega. ye companies state fir company select dropdown me use hogi.
      try {
        const res = await api.get("/companies");
        setCompanies(res.data.companies || []); //jab companies data fetch hota hai to usse companies state me set kar denge, taki wo company select dropdown me dikhai de. agar res.data.companies undefined hai to default empty array use karenge, taki dropdown me koi option na aaye, lekin error na de.
      } catch (err) {
        console.error("Failed to load companies");
      }
    };
    fetchCompanies();
  }, []);

  const handleBasicChange = (e) => { //ye function basic input fields ke change ko handle karega, jaise company, role, year, ctc, cgpaCutoff, tips, resources, prepTime, gotOffer. ye function input field ke name attribute ke basis par form state me us specific field ko update karega. agar input type checkbox hai to uske checked property ko update karega, otherwise value property ko update karega.
    const { name, value, type, checked } = e.target;
    if (error) setError("");
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const goToStep2 = () => {
    const companyOk = String(form.company || "").trim().length > 0;
    const roleOk = String(form.role || "").trim().length > 0;
    const yearNum = Number(form.year);
    const yearOk = Number.isInteger(yearNum) && yearNum >= 2000 && yearNum <= 2100;

    if (!companyOk || !roleOk || !yearOk) {
      setError("Please fill Company, Role, and a valid Year (e.g., 2026)");
      return;
    }

    setError("");
    setStep(2);
  };

  const handleRoundChange = (index, field, value) => { //ye function round input fields ke change ko handle karega, jaise roundNo, type, description, problemsAsked, topics, duration. ye function input field ke name attribute ke basis par form state me us specific field ko update karega.
    const newRounds = [...form.rounds];
    newRounds[index][field] = value;
    setForm({ ...form, rounds: newRounds });
  };

  const addRound = () => {
    setForm({ //ye function ek naya round form me add karega, jab user "Add Round" button pe click karega. ye function form state me rounds array me ek naya round object add karega, jisme roundNo automatically set hoga based on current rounds length, aur type default "Technical" hoga. isse user easily multiple rounds add kar sakta hai apne experience ke liye.
      ...form,
      rounds: [
        ...form.rounds,
        {
          roundNo: form.rounds.length + 1,
          type: "Technical",
          description: "",
          problemsAsked: [],
          topics: [],
          duration: "",
        },
      ],
    });
  };

  const removeRound = (index) => {
    setForm({
      ...form,
      rounds: form.rounds.filter((_, i) => i !== index), //ye function rounds array me se ek specific round ko remove karega, jab user "Remove" button pe click karega. ye function form state me rounds array ko filter karke update karega, jisme se wo round remove ho jayega jiska index match karta hai. isse user easily kisi bhi round ko apne experience se hata sakta hai.
    });
  };

  const validate = () => {
    const companyOk = String(form.company || "").trim().length > 0;
    const roleOk = String(form.role || "").trim().length > 0;
    const yearNum = Number(form.year);
    const yearOk = Number.isInteger(yearNum) && yearNum >= 2000 && yearNum <= 2100;

    if (!companyOk || !roleOk || !yearOk) {
      setError("Company, role, and year are required");
      return false;
    }
    if (form.rounds.some((r) => !r.roundNo || !r.type)) { //ye validation check karega ki rounds array me koi bhi round aisa to nahi jisme roundNo ya type missing ho. agar aisa round milta hai to error message set karega aur validation fail kar dega. isse ensure hoga ki har round ke liye basic details provide ki gayi hain, jo ki experience ke liye important hai.
      setError("Each round must have a number and type");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => { //ye function experience form submit hone par call hoga, jab user "Next" button pe click karega step 3 me. ye function pehle form validation karega, aur agar validation pass ho jata hai to backend ke /experiences endpoint par POST request bhejega, jisme form data payload ke roop me hoga. agar experience successfully create ho jata hai to user ko us company ke page par navigate kar dega, jahan wo apna experience dekh sakta hai.
    if (!validate()) return;

    try {
      setLoading(true);
      setError("");

      const payload = {
        ...form,
        year: Number(form.year),
        cgpaCutoff: form.cgpaCutoff ? Number(form.cgpaCutoff) : null,
        resources: form.resources //ye line resources input field ke value ko payload me set karne ke liye hai. form.resources ek comma-separated string hai, jise split(",") karke array me convert kiya jata hai, aur map() method ka use karke har resource ko trim() karke extra spaces remove kiya jata hai. isse payload me resources property ek clean array of resources ke roop me store hogi, jo ki backend me experience create karte waqt use ki jayegi. resources ka use experience ke sath user ke dwara share kiye gaye helpful materials ko store karne ke liye hota hai, taki future users un resources ko dekh kar apni preparation me use kar sake.
          .split(",")
          .map((r) => r.trim()) //map ka use krke har resource string ke aage peeche ke extra spaces ko remove kiya jata hai, taki resources array me clean entries rahe. agar user ne resources input field me "Book1,  Blog2, Video3" type kiya hai, to split(",") ke baad ["Book1", "  Blog2", " Video3"] milega, jisme Blog2 aur Video3 ke aage ek space hai. map() method ka use karke har resource ko trim() karne se ye spaces remove ho jayenge, aur final array ["Book1", "Blog2", "Video3"] ban jayega, jo ki data consistency ke liye important hai.
          .filter((r) => r), //filter ka use krke empty strings ko remove kiya jata hai, taki resources array me sirf valid resource entries hi rahe. agar user ne resources input field me kuch type nahi kiya hai ya sirf commas type kiye hain, to filter() method un empty entries ko remove kar dega, aur payload me resources property ek clean array of resources ke roop me store hogi. r use kiya jata hai current resource ko represent karne ke liye, aur agar r truthy hai (yaani empty string nahi hai) to hi usse final array me include kiya jata hai. isse data consistency maintain hoti hai, aur backend me experience create karte waqt resources field me sirf valid entries hi jati hain.
      };

      const res = await api.post("/experiences", payload);

      if (res.status === 201) {
        const selectedCompany = companies.find((c) => c._id === form.company); //jab experience successfully create ho jata hai to user ko us company ke page par navigate karne ke liye, pehle hum companies array me se us company ko find karenge jiska _id form.company ke barabar ho. isse hume selectedCompany object mil jayega, jisme company ke details honge, including slug. fir navigate function ka use karke user ko "/companies/" + selectedCompany.slug URL par le jayenge, taki wo us company ke detail page par apna experience dekh sake. agar selectedCompany nahi milta hai (jo ki unlikely hai kyunki user ne dropdown se company select ki hogi), to fallback ke roop me "/companies" URL par navigate kar denge, jahan user saari companies dekh sakta hai.
if (selectedCompany?.slug) {
navigate("/companies/" + selectedCompany.slug);
} else {
navigate("/companies");
}
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create experience");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto w-full max-w-2xl">
        <h1 className="mb-6 text-3xl font-bold text-slate-900">
          Add Your Experience
        </h1>

        {error && <p className="mb-4 rounded bg-red-50 p-3 text-red-600">{error}</p>}

        {/* Step 1: Basic Details */}
        {step === 1 && (
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-800">
              Step 1: Basic Details
            </h2>
            <label className="mb-1 block text-sm font-medium text-slate-700">Company</label>
            <select
              name="company"
              value={form.company}
              onChange={handleBasicChange}
              className="mb-4 w-full rounded border border-slate-300 px-3 py-2"
            >
              <option value="">Select Company</option>
              {companies.map((c) => (
                <option key={c._id} value={c._id}> 
                  {c.name}
                </option>
              ))}
            </select>

            <label className="mb-1 block text-sm font-medium text-slate-700">Role</label>
            <input
              type="text"
              name="role"
              placeholder="Role"
              value={form.role}
              onChange={handleBasicChange}
              className="mb-4 w-full rounded border border-slate-300 px-3 py-2"
            />

            <label className="mb-1 block text-sm font-medium text-slate-700">Year</label>
            <input
              type="number"
              name="year"
              placeholder="Year"
              value={form.year}
              onChange={handleBasicChange} //handleBasicChange function ke through year input field ke value ko form state me update kiya jata hai, taki jab user year input field me kuch type kare to form state me uska updated value reflect ho jaye.
              className="mb-4 w-full rounded border border-slate-300 px-3 py-2"
            />

            <label className="mb-1 block text-sm font-medium text-slate-700">CTC</label>
            <input
              type="text"
              name="ctc"
              placeholder="CTC (e.g., 6-8 LPA)"
              value={form.ctc}
              onChange={handleBasicChange}
              className="mb-4 w-full rounded border border-slate-300 px-3 py-2"
            />

            <label className="mb-1 block text-sm font-medium text-slate-700">CGPA Cutoff</label>
            <input
              type="number"
              name="cgpaCutoff"
              placeholder="CGPA Cutoff"
              value={form.cgpaCutoff}
              onChange={handleBasicChange}
              className="w-full rounded border border-slate-300 px-3 py-2"
            />

            <button
              onClick={goToStep2}
              className="mt-6 w-full rounded bg-slate-900 px-4 py-2 text-white hover:bg-slate-800"
            >
              Next
            </button>
          </div>
        )}

        {/* Step 2: Rounds */}
        {step === 2 && (
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-800">
              Step 2: Interview Rounds
            </h2>

            {form.rounds.map((round, index) => (
              <RoundInput
                key={index}
                round={round}
                index={index}
                onChange={(field, value) =>
                  handleRoundChange(index, field, value)
                }
                onRemove={() => removeRound(index)}
              />
            ))}

            <button
              onClick={addRound}
              className="mb-6 rounded bg-slate-200 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-300"
            >
              + Add Round
            </button>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="w-full rounded border border-slate-300 px-4 py-2 font-medium text-slate-900 hover:bg-slate-50"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="w-full rounded bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-800"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Additional Info */}
        {step === 3 && (
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-800">
              Step 3: Additional Info
            </h2>

            <textarea
              name="tips"
              placeholder="Tips (optional)"
              value={form.tips}
              onChange={handleBasicChange}
              className="mb-4 w-full rounded border border-slate-300 px-3 py-2"
            />

            <input
              type="text"
              name="resources"
              placeholder="Resources (comma-separated)"
              value={form.resources}
              onChange={handleBasicChange}
              className="mb-4 w-full rounded border border-slate-300 px-3 py-2"
            />

            <input
              type="text"
              name="prepTime"
              placeholder="Prep Time (e.g., 8 weeks)"
              value={form.prepTime}
              onChange={handleBasicChange}
              className="mb-4 w-full rounded border border-slate-300 px-3 py-2"
            />

            <label className="mb-6 flex items-center">
              <input
                type="checkbox"
                name="gotOffer"
                checked={form.gotOffer}
                onChange={handleBasicChange}
                className="mr-3"
              />
              <span className="text-slate-900">Got Offer</span>
            </label>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="w-full rounded border border-slate-300 px-4 py-2 font-medium text-slate-900 hover:bg-slate-50"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading} //jab loading true hoga to button disable ho jayega, taki user multiple times submit na kar sake jab experience create hone ka process chal raha ho.
                className="w-full rounded bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {loading ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AddExperience;