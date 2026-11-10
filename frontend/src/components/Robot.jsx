// Crackd bot — a little ink-drawn robot with a highlighter-yellow body.
// `wave` controls whether the right arm waves all the time ("always") or only when a parent is hovered ("hover").
function Robot({ size = 64, wave = "always", className = "" }) {
  return (
    <svg
      className={`robot robot-wave-${wave} ${className}`}
      width={size}
      height={size * 1.1}
      viewBox="0 0 64 70"
      fill="none"
      stroke="var(--ink)"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* antenna */}
      <path d="M32 12 L32 6" />
      <circle cx="32" cy="5" r="3.2" fill="var(--hi)" className="robot-bulb" />
      {/* head */}
      <rect x="13" y="12" width="38" height="26" rx="9" fill="var(--sheet)" />
      <circle cx="24.5" cy="24" r="3.1" fill="var(--ink)" stroke="none" className="robot-eye" />
      <circle cx="39.5" cy="24" r="3.1" fill="var(--ink)" stroke="none" className="robot-eye" />
      <circle cx="19.5" cy="30.5" r="2.4" fill="var(--hi-pink)" stroke="none" />
      <circle cx="44.5" cy="30.5" r="2.4" fill="var(--hi-pink)" stroke="none" />
      <path d="M27.5 30.5 Q32 34.5 36.5 30.5" />
      {/* body */}
      <rect x="20" y="41" width="24" height="18" rx="5" fill="var(--hi)" />
      <path d="M28 50 L31 53 L36.5 46.5" stroke="var(--red)" strokeWidth="2.2" />
      {/* left arm, resting */}
      <path d="M20 46 Q13 50 12 57" />
      {/* right arm, waving */}
      <g className="robot-arm">
        <path d="M44 46 Q51 41 53 33" />
        <circle cx="53.5" cy="30.5" r="3.2" fill="var(--sheet)" />
      </g>
      {/* feet */}
      <path d="M26 59 L26 65 M38 59 L38 65" />
      <path d="M22.5 66 L29 66 M35 66 L41.5 66" />
    </svg>
  );
}

export default Robot;
