import { useEffect, useMemo, useState } from "react"; //useEffect is used to perform side effects in functional components, such as fetching data from an API when the component mounts. useState is used to manage state in functional components, allowing us to store and update values that affect the component's rendering. useMemo is used to memoize expensive calculations or derived data, so that they are only recomputed when their dependencies change, improving performance by avoiding unnecessary recalculations on every render.
import { Link } from "react-router-dom";
import api from "../services/api"; //api is an instance of axios that we have configured to include the base URL for our backend API and to automatically include the JWT token in the Authorization header for all requests. by importing this api instance, we can easily make HTTP requests to our backend without having to worry about setting the base URL or headers each time.
import CompanyCard from "../components/CompanyCard";

function Companies() {
  const [companies, setCompanies] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchCompanies = async () => { //fetchCompanies function is an asynchronous function that is responsible for fetching the list of companies from the backend API. it uses the api instance to send a GET request to the /companies endpoint. while the data is being fetched, it sets the loading state to true and clears any previous error messages. if the request is successful, it updates the companies state with the data received from the backend. if there is an error during the fetch, it sets an appropriate error message in the error state. finally, it sets loading to false to indicate that the fetch operation has completed, regardless of whether it was successful or not.
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/companies");
      setCompanies(res.data.companies || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load companies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies(); //ye useEffect hook component ke run hone par fetchCompanies function ko call karta hai, taki jab user Companies page par aaye to usse companies ki list dikhai de. empty dependency array ([]) ka matlab hai ki ye effect sirf ek baar run hoga, jab component first time render hota hai. isse hum ensure karte hain ki companies data tabhi fetch ho jab user Companies page par aaye, aur baar baar fetch na ho jab component re-render hota hai due to state changes.
  }, []);

  const filteredCompanies = useMemo(() => { //ye useMemo hook filteredCompanies variable ke result ko memoize (cache) karta hai, taki ye expensive filtering operation tabhi run ho jab companies ya search state change ho. isse performance improve hoti hai, kyunki agar user search input me kuch type karta hai to hi filtering logic run hoga, aur agar companies data change hota hai to bhi filtering logic run hoga. agar in dono me se koi bhi change nahi hota to previous filteredCompanies value return kar di jayegi, bina filtering logic ko dobara execute kiye.
    const q = search.trim().toLowerCase(); //search input ko trim() karke extra spaces remove kar diye, aur toLowerCase() karke case-insensitive search ke liye convert kar diya. isse user ko search karte waqt case ya extra spaces ke baare me sochne ki zarurat nahi padegi, aur better user experience milega.
    if (!q) return companies; //if !q then return all companies

    return companies.filter((company) => {
      const byName = company.name?.toLowerCase().includes(q);
      const byRole = (company.roles || []).some((role) => role.toLowerCase().includes(q));//company.roles array me se kisi bhi role ko check karne ke liye some() method ka use kiya gaya hai, jo true return karega agar kisi bhi role me search query q match hoti hai. isse user ko company ke name ke alawa roles ke basis par bhi search karne ki suvidha milegi. agar company.roles undefined hai to default empty array use kiya jayega, taki some() method error na de.
      const byDifficulty = company.difficulty?.toLowerCase().includes(q);
      return byName || byRole || byDifficulty;
    });
  }, [companies, search]); //filteredCompanies variable me companies ko filter karke store kiya gaya hai, based on the search query. is filtering logic me company ke name, roles, aur difficulty level ko check kiya jata hai, aur agar search query inme se kisi me match hoti hai to wo company filteredCompanies me include ho jati hai. useMemo ka use karke ye ensure kiya gaya hai ki ye filtering logic tabhi run ho jab companies ya search state change ho, taki performance optimize ho.

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0b1220] text-white">
      <div className="mx-auto w-full max-w-6xl container-glass p-8">
        <div className="-mx-8 -mt-8 mb-8 h-1 bg-gradient-to-r from-sky-500 via-indigo-500 to-emerald-400" />

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">
              Company Explorer
            </p>
            <h1 className="page-title mb-2 text-blue-900">Companies</h1>
            <p className="page-subtitle">Search by company name, role, or difficulty.</p>
          </div>

          <Link to="/add-experience" className="btn-primary whitespace-nowrap">
            + Add Experience
          </Link>
        </div>

        <input
          type="text"
          placeholder="Search companies, roles, difficulty..."
          value={search}
          onChange={(e) => setSearch(e.target.value)} //search input field ke value ko search state se bind kiya gaya hai, aur onChange event me setSearch function call karke search state update kiya jata hai. isse jab user search input me kuch type karega to search state update hoga, aur uske basis par filteredCompanies variable re-compute hoga, jisse UI me filtered list of companies dikhai degi.
          className="input mb-6 shadow-soft"
        />

        {loading && <p className="text-slate-600">Loading companies...</p>} 
        {error && <p className="text-red-600">{error}</p>}

        {!loading && !error && filteredCompanies.length === 0 && (
          <p className="text-slate-600">No companies found.</p>
        )}

        {!loading && !error && filteredCompanies.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCompanies.map((company) => (
              <CompanyCard key={company._id} company={company} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Companies; 