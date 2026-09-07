import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div className="home-page min-h-screen text-slate-950">
      <div className="home-noise" />
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-7 lg:px-8">
        <Link to="/" className="brand-mark"><span>c</span>rackd<span className="brand-dot">.</span></Link>
        <div className="flex items-center gap-3 text-sm font-semibold">
          <span className="hidden text-slate-500 sm:inline">Your next interview starts here</span>
          <Link to="/login" className="home-login">Log in <span aria-hidden="true">↗</span></Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-6 pb-16 pt-10 lg:px-8 lg:pt-20">
        <section className="home-hero-grid">
          <div className="home-hero-copy">
            <div className="eyebrow"><span className="pulse-dot" /> Placement prep, with a pulse</div>
            <h1>Turn your<br /><em>potential</em> into<br />an offer.</h1>
            <p className="home-lede">A focused workspace for students who are done collecting resources and ready to prepare with intent.</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link to="/register" className="home-cta">Build your prep plan <span aria-hidden="true">↗</span></Link>
              <Link to="/login" className="home-text-link">I already have an account <span aria-hidden="true">→</span></Link>
            </div>
          </div>

          <div className="home-visual" aria-label="Crackd preparation dashboard preview">
            <div className="orbit orbit-one" /><div className="orbit orbit-two" />
            <div className="signal-card">
              <div className="signal-top"><span>YOUR PREP SIGNAL</span><span className="signal-live"><i /> LIVE</span></div>
              <div className="signal-score">78<span>%</span></div>
              <div className="signal-caption">interview readiness</div>
              <div className="signal-chart"><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /></div>
              <div className="signal-foot"><span>+12% this week</span><span>Keep the streak alive</span></div>
            </div>
            <div className="floating-note note-roadmap"><span className="note-icon">↗</span><div><strong>Roadmap ready</strong></div></div>
            <div className="floating-note note-streak"><span className="note-icon note-fire">✦</span><div><strong>7 day streak</strong><small>Consistency compounds</small></div></div>
          </div>
        </section>

        <section className="home-strip" aria-label="Crackd features">
          <div className="strip-intro"><span>01</span><p>Everything you need to move from “I should prepare” to “I’m ready.”</p></div>
          <div className="strip-item"><b>01</b><strong>Roadmaps that fit you</strong><span>Targeted plans for your role, company, and weak spots.</span></div>
          <div className="strip-item"><b>02</b><strong>Progress you can see</strong><span>Small daily wins, visible momentum, real confidence.</span></div>
          <div className="strip-item"><b>03</b><strong>Signals from the field</strong><span>Learn from interview experiences shared by peers.</span></div>
        </section>
      </main>
    </div>
  );
};

export default Home;
