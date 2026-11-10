import { Link } from "react-router-dom";

// Wordmark: an ink tile with a crack running through it, then "crackd".
function Logo({ to = "/" }) {
  return (
    <Link to={to} className="logo" aria-label="Crackd home">
      <span className="logo-mark" aria-hidden="true">
        <svg width="14" height="18" viewBox="0 0 14 18" fill="none">
          <path
            d="M5 1 L9 6.5 L5.5 9 L10 13 L7.5 17"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="logo-word">
        crack<i>d</i>
      </span>
    </Link>
  );
}

export default Logo;
