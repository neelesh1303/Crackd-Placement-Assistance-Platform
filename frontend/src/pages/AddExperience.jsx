import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import PageShell from "../components/PageShell";
import RoundInput from "../components/RoundInput";
import { Notice } from "../components/Bits";

function AddExperience() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); //useSate ka use hm tb krte hai jb hm koi data initially store krte hai and data update hone pe hme ui update krke dikhana hota hai
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    company: "",
    role: "",
    year: "",
    visitMonth: "",
    visitYear: "",
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
    const hasCalendarYear = Number.isInteger(yearNum) && yearNum >= 2000 && yearNum <= 2100;
    const hasStudyYear = Number.isInteger(yearNum) && yearNum >= 1 && yearNum <= 10;
    const yearOk = hasCalendarYear || hasStudyYear;

    if (!companyOk || !roleOk || !yearOk) {
      setError("Please fill Company, Role, and a valid Year (e.g., 2026 or 4)");
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
    const hasCalendarYear = Number.isInteger(yearNum) && yearNum >= 2000 && yearNum <= 2100;
    const hasStudyYear = Number.isInteger(yearNum) && yearNum >= 1 && yearNum <= 10;
    const yearOk = hasCalendarYear || hasStudyYear;

    if (!companyOk || !roleOk || !yearOk) {
      setError("Company, role, and a valid year are required");
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
        const savedCompanySlug = res.data.experience?.company?.slug;
        if (savedCompanySlug) {
          navigate("/companies/" + savedCompanySlug);
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

  const STEPS = ["The basics", "The rounds", "Looking back"];

  return (
    <PageShell
      title={<>Tell it like it <span className="serif italic">was.</span></>}
      subtitle="Write down what they asked you. Someone a year behind you is going to read this the night before."
      activeTab="experience"
      note="honest > polished"
      actions={
        <button type="button" onClick={() => navigate("/companies")} className="btn">
          Browse companies
        </button>
      }
    >
      <div className="mx-auto w-full max-w-3xl">
        {/* step indicator */}
        <ol className="mb-8 grid list-none grid-cols-3 gap-2 p-0">
          {STEPS.map((label, i) => {
            const n = i + 1;
            const state = n < step ? "done" : n === step ? "now" : "next";
            return (
              <li key={label} className="flex flex-col gap-2">
                <span
                  className={`h-2 rounded-full border-[1.5px] border-[color:var(--ink)] ${
                    state === "done" ? "bg-[color:var(--hi-green)]" : state === "now" ? "bg-[color:var(--hi)]" : "bg-transparent"
                  }`}
                />
                <span className={`mono text-xs ${state === "next" ? "faint" : ""}`}>
                  {String(n).padStart(2, "0")} · {label}
                </span>
              </li>
            );
          })}
        </ol>

        {error && <div className="mb-6"><Notice tone="error">{error}</Notice></div>}

        {/* Step 1: Basic Details */}
        {step === 1 && (
          <div className="sheet taped sheet-pad rise space-y-5">
            <h2 className="text-2xl font-extrabold">Which company, which role?</h2>

            <div>
              <label htmlFor="exp-company" className="field-label">Company</label>
              <input
                id="exp-company"
                type="text"
                name="company"
                value={form.company}
                onChange={handleBasicChange}
                placeholder="e.g. Infosys"
                className="field"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="exp-role" className="field-label">Role</label>
                <input
                  id="exp-role"
                  type="text"
                  name="role"
                  placeholder="SDE Intern"
                  value={form.role}
                  onChange={handleBasicChange}
                  className="field"
                />
              </div>
              <div>
                <label htmlFor="exp-year" className="field-label">Year</label>
                <input
                  id="exp-year"
                  type="number"
                  name="year"
                  placeholder="2026 or 4"
                  value={form.year}
                  onChange={handleBasicChange}
                  className="field"
                />
                <p className="field-hint">Calendar year or your year of study.</p>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="exp-month" className="field-label">Visit month</label>
                <select
                  id="exp-month"
                  name="visitMonth"
                  value={form.visitMonth}
                  onChange={handleBasicChange}
                  className="field"
                >
                  <option value="">Select month</option>
                  {[
                    "January",
                    "February",
                    "March",
                    "April",
                    "May",
                    "June",
                    "July",
                    "August",
                    "September",
                    "October",
                    "November",
                    "December",
                  ].map((month) => (
                    <option key={month} value={month}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="exp-visit-year" className="field-label">Visit year</label>
                <select
                  id="exp-visit-year"
                  name="visitYear"
                  value={form.visitYear}
                  onChange={handleBasicChange}
                  className="field"
                >
                  <option value="">Select year</option>
                  {Array.from({ length: 12 }, (_, idx) => new Date().getFullYear() - 2 + idx).map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="exp-ctc" className="field-label">CTC</label>
                <input
                  id="exp-ctc"
                  type="text"
                  name="ctc"
                  placeholder="6-8 LPA"
                  value={form.ctc}
                  onChange={handleBasicChange}
                  className="field"
                />
              </div>
              <div>
                <label htmlFor="exp-cgpa" className="field-label">CGPA cutoff</label>
                <input
                  id="exp-cgpa"
                  type="number"
                  name="cgpaCutoff"
                  placeholder="7.5"
                  value={form.cgpaCutoff}
                  onChange={handleBasicChange}
                  className="field"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button type="button" onClick={goToStep2} className="btn btn-ink">
                Next: the rounds <span className="arrow">→</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Rounds */}
        {step === 2 && (
          <div className="rise">
            <h2 className="mb-5 text-2xl font-extrabold">Walk us through each round.</h2>

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
              type="button"
              onClick={addRound}
              className="mb-8 w-full rounded-[10px] border-[1.5px] border-dashed border-[color:var(--ink)] py-4 font-bold transition hover:bg-[color:var(--hi)]"
            >
              + Add another round
            </button>

            <div className="flex justify-between gap-3">
              <button type="button" onClick={() => setStep(1)} className="btn">
                ← Back
              </button>
              <button type="button" onClick={() => setStep(3)} className="btn btn-ink">
                Next: looking back <span className="arrow">→</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Additional Info */}
        {step === 3 && (
          <div className="sheet taped sheet-pad rise space-y-5">
            <h2 className="text-2xl font-extrabold">If you could tell your past self one thing…</h2>

            <div>
              <label htmlFor="exp-tips" className="field-label">Tips</label>
              <textarea
                id="exp-tips"
                name="tips"
                placeholder="What would you do differently? What actually helped?"
                value={form.tips}
                onChange={handleBasicChange}
                className="field"
              />
            </div>

            <div>
              <label htmlFor="exp-resources" className="field-label">Resources · comma separated</label>
              <input
                id="exp-resources"
                type="text"
                name="resources"
                placeholder="Striver's sheet, GFG OS notes, NeetCode 150"
                value={form.resources}
                onChange={handleBasicChange}
                className="field"
              />
            </div>

            <div>
              <label htmlFor="exp-prep" className="field-label">How long did you prep?</label>
              <input
                id="exp-prep"
                type="text"
                name="prepTime"
                placeholder="8 weeks"
                value={form.prepTime}
                onChange={handleBasicChange}
                className="field"
              />
            </div>

            <label className="check">
              <input
                type="checkbox"
                name="gotOffer"
                checked={form.gotOffer}
                onChange={handleBasicChange}
              />
              I got the offer
              {form.gotOffer && <span className="stamp stamp-green ml-2">nice!</span>}
            </label>

            <div className="flex justify-between gap-3 pt-2">
              <button type="button" onClick={() => setStep(2)} className="btn">
                ← Back
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading} //jab loading true hoga to button disable ho jayega, taki user multiple times submit na kar sake.
                className="btn btn-hi"
              >
                {loading ? "Pinning it up…" : "Publish experience"}
              </button>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}

export default AddExperience;
