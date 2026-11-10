// Small shared UI pieces used across pages.

export function Loader({ label = "Sharpening pencils" }) {
  return (
    <div className="loading" role="status">
      <span className="pencil" aria-hidden="true" />
      {label}…
    </div>
  );
}

export function Notice({ tone = "info", children }) {
  const word = tone === "error" ? "Oops" : tone === "ok" ? "Done" : "Note";
  return (
    <div className={`notice notice-${tone}`} role={tone === "error" ? "alert" : "status"}>
      <b>{word}</b>
      <div>{children}</div>
    </div>
  );
}

export function Empty({ title, children, action }) {
  return (
    <div className="empty">
      <p className="hand">{title}</p>
      {children && <p className="mx-auto max-w-md">{children}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}
