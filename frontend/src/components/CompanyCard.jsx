import { Link } from "react-router-dom"; //Link component is used to create links in the application that allow users to navigate between different routes without causing a full page reload.
import CompanyLabel from "./CompanyLabel";
function CompanyCard({ company }) { //CompanyCard component is a reusable component that takes a company object as a prop and displays its information in a card format. it shows the company name, difficulty level, visit month, and roles. it also includes a link to the company details page using the company's slug for navigation.
   // span is used to display the difficulty level of the company, and its background color changes based on whether the difficulty is "Hard", "Medium", or "Easy". the roles are displayed as small badges. span ka use small pieces of information ko highlight karne ke liye hota hai, aur yahan hum difficulty level ko visually differentiate karne ke liye span ka use kar rahe hain. similarly, roles ko badges ke form me display karne ke liye bhi span ka use kiya gaya hai, taki wo easily distinguishable ho jaye.
    return (
    <div className="card-soft hover-lift overflow-hidden p-4 bg-gradient-to-br from-slate-800/80 to-slate-900/80 text-slate-100">
      <div className="-mx-4 -mt-4 mb-4 h-1 bg-gradient-to-r from-sky-500 via-cyan-400 to-emerald-400" />
      <div className="mb-3 flex items-center justify-between">
          <CompanyLabel company={company} size="md" />
        <span
          className={`rounded-full px-2 py-1 text-xs font-medium shadow-sm ${
            company.difficulty === "Hard"
              ? "bg-rose-100 text-rose-700"
              : company.difficulty === "Medium"
              ? "bg-amber-100 text-amber-700"
              : "bg-emerald-100 text-emerald-700"
          }`}
        >
          {company.difficulty}
        </span>
      </div>

      <p className="mb-2 text-sm text-slate-300">
        Visit: <span className="font-medium text-white">{company.visitMonth || "N/A"}{company.visitYear ? ` ${company.visitYear}` : ""}</span>
      </p>

      <div className="mb-4 flex flex-wrap gap-2">
        {(company.roles || []).slice(0, 3).map((role) => ( //company.roles array me se pehle 3 roles ko display karne ke liye slice(0, 3) ka use kiya gaya hai. agar company.roles undefined hai to default empty array use kiya jayega, taki map function error na de. isse hum ensure karte hain ki agar kisi company ke roles data me missing hai to bhi component sahi tarah se render ho jaye.
          <span
            key={role}
            className="rounded-md bg-slate-700 px-2 py-1 text-xs text-slate-100"
          >
            {role}
          </span>
        ))}
      </div>

      <Link
        to={`/companies/${company.slug}`}
        className="btn-primary px-4 py-2 text-sm"
      >
        View Details
      </Link>
    </div>
  );
}

export default CompanyCard;