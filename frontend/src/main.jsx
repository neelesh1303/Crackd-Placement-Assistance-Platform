// /Yahin se React app start hota hai aur browser me inject hota hai

import { StrictMode } from "react";
import { createRoot } from "react-dom/client"; //Ye React ko browser ke DOM me render karne ke liye use hota hai
import "./index.css";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>
);