import Logo from "./Logo";

// Shared two-column layout for Login and Register: a scribbled note on the left, the form sheet on the right.
function AuthLayout({ kicker, title, aside, children }) {
  return (
    <div className="min-h-screen">
      <header className="mx-auto max-w-6xl px-4 py-5 lg:px-8">
        <Logo />
      </header>
      <main className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-6 lg:grid-cols-[1fr_0.95fr] lg:px-8 lg:pt-12">
        <section className="rise">
          <span className="kicker"><b>§</b> {kicker}</span>
          <h1 className="display mt-5">{title}</h1>
          <div className="mt-8">{aside}</div>
        </section>
        <div className="rise" style={{ "--i": 2 }}>
          {children}
        </div>
      </main>
    </div>
  );
}

export default AuthLayout;
