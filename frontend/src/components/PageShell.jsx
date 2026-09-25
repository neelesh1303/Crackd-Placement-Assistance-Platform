import { useLocation, useNavigate } from "react-router-dom";

const tabs = [
  { id: "dashboard", label: "Dashboard", to: "/dashboard" },
  { id: "companies", label: "Companies", to: "/companies" },
  { id: "roadmap", label: "Roadmap", to: "/roadmap" },
  { id: "progress", label: "Progress", to: "/progress" },
  { id: "chat", label: "Assistant", to: "/chat" },
  { id: "experience", label: "Add Experience", to: "/add-experience" },
];

const getTabId = (pathname) => {
  if (pathname.startsWith("/companies")) return "companies";
  if (pathname.startsWith("/roadmap-details")) return "roadmap";
  if (pathname.startsWith("/roadmap")) return "roadmap";
  if (pathname.startsWith("/progress")) return "progress";
  if (pathname.startsWith("/chat")) return "chat";
  if (pathname.startsWith("/add-experience")) return "experience";
  return "dashboard";
};

function PageShell({ title, subtitle, activeTab, actions, children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const currentTab = activeTab || getTabId(location.pathname);

  return (
    <div className="workspace-shell min-h-screen text-slate-100">
      <div className="workspace-atmosphere" aria-hidden="true">
        <span className="signal-line signal-line-one" />
        <span className="signal-line signal-line-two" />
        <span className="signal-node signal-node-one" />
        <span className="signal-node signal-node-two" />
      </div>
      <div className="workspace-content mx-auto max-w-7xl px-4 py-8 lg:px-8 lg:py-12">
        <header className="workspace-header mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="workspace-brand" aria-label="Crackd prep workspace">
              <span className="workspace-brand-mark"><span>c</span>rackd<span className="workspace-brand-dot">.</span></span>
              <span className="workspace-brand-divider" />
              <span className="workspace-brand-label">prep workspace</span>
            </div>
            <h1 className="mt-5 text-4xl font-extrabold tracking-tight sm:text-5xl">{title}</h1>
            {subtitle && <p className="workspace-subtitle mt-4 max-w-2xl">{subtitle}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
        </header>

        <nav className="workspace-tabs mb-10 flex flex-wrap gap-2 border-b pb-4" aria-label="Main navigation">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => navigate(tab.to)}
              className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition ${
                currentTab === tab.id
                  ? "workspace-tab-active shadow-lg"
                  : "text-slate-500 hover:bg-white/10 hover:text-slate-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <main className="workspace-main">{children}</main>
      </div>
    </div>
  );
}

export default PageShell;
