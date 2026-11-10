import { Link } from "react-router-dom"; //Link component is used to create links in the application that allow users to navigate between different routes without causing a full page reload.
import CompanyLabel from "./CompanyLabel";

// difficulty ko ek stamp jaisa dikhate hain — Hard = red, Medium = blue, Easy = green
const difficultyStamp = (difficulty) => {
  if (difficulty === "Hard") return "stamp";
  if (difficulty === "Medium") return "stamp stamp-blue";
  return "stamp stamp-green";
};

function CompanyCard({ company, index = 0 }) {
  const visit = `${company.visitMonth || "TBA"}${company.visitYear ? ` ’${String(company.visitYear).slice(-2)}` : ""}`;

  return (
    <Link
      to={`/companies/${company.slug}`}
      className="sheet lift rise group flex flex-col p-5"
      style={{ "--i": index % 9 }}
    >
      <div className="mb-5 flex items-start justify-between gap-3">
        <CompanyLabel company={company} size="md" />
        {company.difficulty && <span className={difficultyStamp(company.difficulty)}>{company.difficulty}</span>}
      </div>

      <div className="mb-5 flex flex-wrap gap-1.5">
        {(company.roles || []).slice(0, 3).map((role) => ( //company.roles array me se pehle 3 roles ko display karne ke liye slice(0, 3) ka use kiya gaya hai.
          <span key={role} className="tag">
            {role}
          </span>
        ))}
        {(company.roles || []).length > 3 && (
          <span className="tag tag-ghost">+{company.roles.length - 3}</span>
        )}
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-dashed border-[color:var(--ink-3)] pt-3">
        <span className="mono text-xs muted">visits · {visit}</span>
        <span className="text-sm font-bold transition-transform group-hover:translate-x-1">Open file →</span>
      </div>
    </Link>
  );
}

export default CompanyCard;
