import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import CompanyCard from "../components/CompanyCard";
import PageShell from "../components/PageShell";
import { Empty, Loader, Notice } from "../components/Bits";

function Companies() {
  const [companies, setCompanies] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // backend se companies ki list fetch karta hai
  const fetchCompanies = async () => {
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
    fetchCompanies(); //component mount hone par ek baar companies fetch karte hain
  }, []);

  // name, role ya difficulty ke basis par filter — useMemo se tabhi chalega jab companies ya search badle
  const filteredCompanies = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return companies;

    return companies.filter((company) => {
      const byName = company.name?.toLowerCase().includes(q);
      const byRole = (company.roles || []).some((role) => role.toLowerCase().includes(q));
      const byDifficulty = company.difficulty?.toLowerCase().includes(q);
      return byName || byRole || byDifficulty;
    });
  }, [companies, search]);

  return (
    <PageShell
      title="Company files"
      subtitle="Every company that's visited campus. Search by name, role, or how hard they are."
      activeTab="companies"
      note="tip: try searching “hard”"
      actions={
        <Link to="/add-experience" className="btn btn-hi">
          + Add your experience
        </Link>
      }
    >
      <div className="space-y-8">
        <div className="relative max-w-2xl">
          <label htmlFor="company-search" className="field-label">Search the files</label>
          <input
            id="company-search"
            type="text"
            placeholder="Company, role, difficulty…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="field !py-4 text-lg"
          />
          {!loading && !error && (
            <p className="mono mt-2 text-xs muted">
              showing {filteredCompanies.length} of {companies.length}
            </p>
          )}
        </div>

        {loading && <Loader label="Pulling the files" />}
        {error && <Notice tone="error">{error}</Notice>}

        {!loading && !error && filteredCompanies.length === 0 && (
          <Empty title="No match on file.">Try a different name or role — or clear the search.</Empty>
        )}

        {!loading && !error && filteredCompanies.length > 0 && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCompanies.map((company, index) => (
              <CompanyCard key={company._id} company={company} index={index} />
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}

export default Companies;
