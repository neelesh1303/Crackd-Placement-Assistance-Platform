import { Link, useLocation } from "react-router-dom";
import Robot from "./Robot";

// Glowing highlighter button pinned to the bottom-right that opens the Crackd bot.
// Hidden on the chat page itself and on the auth screens.
const HIDDEN_ON = ["/chat", "/login", "/register"];

function AskFab() {
  const { pathname } = useLocation();
  if (HIDDEN_ON.some((path) => pathname.startsWith(path))) return null;

  return (
    <Link to="/chat" className="ask-fab" aria-label="Ask Crackd bot">
      <span className="ask-fab-bot">
        <Robot size={30} wave="hover" />
      </span>
      <span className="ask-fab-label">
        Ask Crackd <span className="hand">bot</span>
      </span>
    </Link>
  );
}

export default AskFab;
