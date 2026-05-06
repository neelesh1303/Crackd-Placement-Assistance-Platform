import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import CompanyLabel from "../components/CompanyLabel";

function CompanyDetail() {
  const { slug } = useParams(); //useParams hook is used to access the URL parameters in a React Router component. in this case, we are extracting the "slug" parameter from the URL, which represents the unique identifier for a company. this slug will be used to fetch the specific company details and its associated experiences from the backend API.

  const [company, setCompany] = useState(null); //company state is used to store the details of the company that we fetch from the backend. initially it is set to null, which indicates that we haven't loaded any company data yet. once we fetch the company data using the slug, we will update this state with the retrieved company information, which will then be used to render the company details on the page.
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();


  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(""); //jab bhi hum new company ke details load karne jaye, to pehle loading true kar denge, taki user ko pata chale ki data load ho raha hai. 
        const companyRes = await api.get("/companies/" + slug);
        setCompany(companyRes.data.company || null); //jab company details successfully fetch ho jaye to company state ko update kar denge. agar backend se company data nahi aata hai to default null set kar denge, taki UI me "Company not found" message dikhai de.

        const expRes = await api.get("/experiences?company=" + encodeURIComponent(slug)); //jab company details fetch ho jaye to uske baad us company ke experiences fetch karne ke liye ek aur API call karenge. is request me query parameter "company" ke through slug bhej rahe hain, taki backend ko pata chale ki hume kis company ke experiences chahiye. encodeURIComponent() function ka use karke slug ko URL-safe format me convert kar rahe hain, taki agar slug me special characters hain to wo properly encode ho jaye aur API request me error na aaye.
        setExperiences(expRes.data.experiences || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load company details");
      } finally {
        setLoading(false);
      }
    };

    loadData();  //jb bhi slug change ho call the loadData function to fetch the new company details and experiences. isse ensure hoga ki jab user kisi different company ke details dekhne jaye to hum us company ke data ko fetch karke display kar sake.
  }, [slug]); //[slug] is a dependency array for the useEffect hook, which means that the effect will run whenever the slug variable changes. this is important because when the user navigates to a different company's detail page (which would have a different slug), we want to trigger the loadData function again to fetch and display the new company's details and experiences. without this dependency, the effect would only run once when the component mounts, and it would not update when the slug changes, leading to stale data being displayed.

//dependency array is a list jsse react ye decide krta hai ki useEffect kb run hoga. jaise yha dependency array mein "slug" variable hai to iska matlab hai ki useEffect tabhi run hoga jab "slug" variable change hoga. 

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-5xl text-slate-600">Loading company details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-5xl">
          <p className="mb-4 rounded bg-red-50 p-3 text-red-700">{error}</p>
          <Link to="/companies" className="text-sm font-medium text-slate-700 underline">
            Back to companies
          </Link>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-5xl">
          <p className="text-slate-700">Company not found.</p>
          <Link to="/companies" className="text-sm font-medium text-slate-700 underline">
            Back to companies
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-5xl container-glass p-8">
        <Link to="/companies" className="mb-4 inline-block text-sm font-medium text-slate-700 underline">
          Back to companies
        </Link>

        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <CompanyLabel company={company} size="lg" />
            <span
              className={
                "rounded-full px-2 py-1 text-xs font-medium " +
                (company.difficulty === "Hard"
                  ? "bg-rose-100 text-rose-700"
                  : company.difficulty === "Medium"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-emerald-100 text-emerald-700")
              }
            >
              {company.difficulty}
            </span>
          </div>

          <p className="mb-3 text-sm text-slate-600">
            Visit Month: <span className="font-medium text-slate-800">{company.visitMonth || "N/A"}</span>
          </p>

          <div className="flex flex-wrap gap-2">
            {(company.roles || []).map((role) => ( //company.roles array me se har role ko display karne ke liye map() method ka use kiya gaya hai. agar company.roles undefined hai to default empty array use kiya jayega, taki map function error na de. isse hum ensure karte hain ki agar kisi company ke roles data me missing hai to bhi component sahi tarah se render ho jaye.
              <span key={role} className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700">
                {role}
              </span> //span ka use karke hum har role ko ek badge ke form me display kar rahe hain, taki wo easily distinguishable ho jaye. isse user ko company ke roles ko quickly identify karne me madad milegi.
            ))}
          </div>

          {/* Prepare button - navigates to roadmap with inferred topics */}
          <div className="mt-4">
            <button
              onClick={() => {
                // derive top topics from experiences (rounds -> topics)
                const allTopics = experiences.flatMap((e) => (Array.isArray(e.rounds) ? e.rounds.flatMap((r) => r.topics || []) : []));
                const freq = {};
                allTopics.forEach((t) => {
                  if (!t) return;
                  freq[t] = (freq[t] || 0) + 1;
                });
                const sorted = Object.keys(freq).sort((a, b) => freq[b] - freq[a]);
                const topTopics = sorted.slice(0, 12);

                navigate('/roadmap', { state: { companySlug: slug, weakTopics: topTopics } });
              }}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-white font-semibold hover:bg-indigo-700 transition-all"
            >
              Prepare for this company
            </button>
          </div>
        </div>

        <h2 className="mb-3 text-xl font-semibold text-slate-900">Experiences</h2>

        {experiences.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-5 text-slate-600 shadow-sm">
            No experiences yet for this company.
          </div>
        )}

        <div className="space-y-4">
          {experiences.map((exp) => ( //experiences array me se har experience ke liye ek card render kiya jata hai, jisme experience ke role, year, offer status, tips, aur rounds ki details dikhai jati hai. key prop me exp._id use kiya gaya hai, jo React ko efficiently update karne me help karta hai jab list of experiences change hoti hai. map ka use karke hum dynamically experiences ko render kar rahe hain, taki jab bhi new experience add ho ya existing experience update ho to wo automatically UI me reflect ho jaye.
            <div key={exp._id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-2 flex flex-wrap items-center gap-3">
                <span className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700">Role: {exp.role}</span>
                <span className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700">Year: {exp.year}</span>
                <span className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700">
                  Offer: {exp.gotOffer ? "Yes" : "No"}
                </span>
              </div>

              {exp.tips ? (
                <p className="mb-3 text-sm text-slate-700">
                  <span className="font-semibold">Tips:</span> {exp.tips}
                </p>
              ) : null}

              {Array.isArray(exp.rounds) && exp.rounds.length > 0 ? ( //ye check karta hai ki exp.rounds ek array hai aur usme kam se kam ek round hai, taki hum rounds ki details tabhi dikhaye jab wo available ho. agar exp.rounds undefined hai ya empty array hai to ye block skip ho jayega, aur UI me unnecessary empty section nahi dikhai dega.
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-slate-900">Rounds</h3>
                  <div className="space-y-2">
                    {exp.rounds.map((round, idx) => (
                      <div key={idx} className="rounded-lg border border-slate-200 p-3">
                        <p className="text-sm font-medium text-slate-800">
                          Round {round.roundNo}: {round.type}
                        </p>
                        {round.description ? <p className="mt-1 text-sm text-slate-700">{round.description}</p> : null}

                        {Array.isArray(round.problemsAsked) && round.problemsAsked.length > 0 ? (
                          <div className="mt-2 text-sm text-slate-700">
                            <p className="font-medium">Problems asked:</p>
                            <ul className="list-disc pl-5 mt-1 space-y-1">
                              {round.problemsAsked.map((problem, pIdx) => (
                                <li key={pIdx}>{problem}</li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CompanyDetail;