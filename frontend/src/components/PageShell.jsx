import { useLocation, useNavigate } from "react-router-dom";

const tabs = [
  { id: "dashboard", label: "Dashboard", to: "/dashboard" },
  { id: "companies", label: "Companies", to: "/companies" },
  { id: "roadmap", label: "Roadmap", to: "/roadmap" },
  { id: "progress", label: "Progress", to: "/progress" },
  { id: "experience", label: "Add Experience", to: "/add-experience" },
];

const getTabId = (pathname) => {
  if (pathname.startsWith("/companies")) return "companies";
  if (pathname.startsWith("/roadmap-details")) return "roadmap";
  if (pathname.startsWith("/roadmap")) return "roadmap";
  if (pathname.startsWith("/progress")) return "progress";
  if (pathname.startsWith("/add-experience")) return "experience";
  return "dashboard";
};

function PageShell({ title, subtitle, activeTab, actions, children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const currentTab = activeTab || getTabId(location.pathname);

  return (
    <div className="workspace-shell min-h-screen text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
        <div className="workspace-panel rounded-[2rem] border p-8 shadow-[0_32px_90px_rgba(15,23,42,0.12)] backdrop-blur-xl">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="workspace-kicker">Crackd prep workspace</p>
              <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">{title}</h1>
              {subtitle && <p className="mt-4 max-w-2xl text-slate-600">{subtitle}</p>}
            </div>
            {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
          </div>

          <div className="workspace-tabs mb-8 flex flex-wrap gap-3 border-b pb-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => navigate(tab.to)}
                className={`whitespace-nowrap rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                  currentTab === tab.id
                    ? "workspace-tab-active shadow-lg"
                    : "text-slate-500 hover:bg-white/70 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}

export default PageShell;
