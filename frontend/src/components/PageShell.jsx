import { NavLink, useLocation, useNavigate } from "react-router-dom";
import Logo from "./Logo";
import { useAuth } from "../context/useAuth";

const tabs = [
  { id: "dashboard", label: "Desk", to: "/dashboard" },
  { id: "companies", label: "Companies", to: "/companies" },
  { id: "roadmap", label: "Roadmap", to: "/roadmap" },
  { id: "progress", label: "Progress", to: "/progress" },
  { id: "experience", label: "Share story", to: "/add-experience" },
];

const getTabId = (pathname) => {
  if (pathname.startsWith("/companies")) return "companies";
  if (pathname.startsWith("/roadmap-details")) return "progress";
  if (pathname.startsWith("/roadmap")) return "roadmap";
  if (pathname.startsWith("/progress")) return "progress";
  if (pathname.startsWith("/chat")) return "chat";
  if (pathname.startsWith("/add-experience")) return "experience";
  return "dashboard";
};

const initialsOf = (name) =>
  (name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("") || "Me";

function PageShell({ title, subtitle, activeTab, actions, note, children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const currentTab = activeTab || getTabId(location.pathname);

  const handleSignOut = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen">
      <header className="topbar">
        <div className="topbar-inner">
          <Logo to="/dashboard" />
          <nav className="nav" aria-label="Main navigation">
            {tabs.map((tab, index) => (
              <NavLink
                key={tab.id}
                to={tab.to}
                className={`nav-link ${currentTab === tab.id ? "is-active" : ""}`}
              >
                <small>{String(index + 1).padStart(2, "0")}</small>
                {tab.label}
              </NavLink>
            ))}
          </nav>
          <div className="topbar-user">
            <span className="avatar-chip hidden sm:grid" title={user?.name || "You"}>
              {initialsOf(user?.name)}
            </span>
            <button type="button" onClick={handleSignOut} className="btn btn-sm btn-ghost">
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="page">
        <div className="page-head rise">
          {note && <p className="margin-note">{note}</p>}
          <div className="min-w-0">
            <span className="kicker">
              crackd / prep notebook
            </span>
            <h1 className="page-title">{title}</h1>
            {subtitle && <p className="page-sub">{subtitle}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
        </div>

        <main>{children}</main>
      </div>

      <footer className="colophon">
        <span>crackd — written in pencil, revised in pen.</span>
        <span>made by students who also panicked before their first OA</span>
      </footer>
    </div>
  );
}

export default PageShell;
