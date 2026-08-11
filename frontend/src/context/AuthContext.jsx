//This file is creating a global login system in React. Once user logs in, poori app ko pata hota hai
// You don’t have to pass user data everywhere manually


import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";

const AuthContext = createContext(); //like a global storage box 

export const AuthProvider = ({ children }) => { //wrapper function. provides data to child components
  const [user, setUser] = useState(null); //user state to store logged in user data. initially null, jab tak user login nahi karta. jab user login karega to uska data is state me store ho jayega. aur poori app me available hoga through context.
  const [token, setToken] = useState(localStorage.getItem("token") || ""); //token state to store JWT token. initially set to value from localStorage if exists, otherwise empty string. jab user login karega to uska token is state me store ho jayega. aur poori app me available hoga through context.
  const [loading, setLoading] = useState(true); //loading state to indicate if user data is being fetched. initially true, jab tak user data fetch nahi hota. jab user data fetch ho jayega to loading false ho jayega. aur poori app me available hoga through context.

  const login = (data) => { // jab user login karega to uska data is function me aayega, aur hum usse user state me set kar denge, aur token state me set kar denge. aur localStorage me bhi save kar denge, taki page refresh hone par bhi token available rahe.
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem("token", data.token);
  };

  const logout = () => { // jab user logout karega to hum token aur user state ko reset kar denge, aur localStorage se token remove kar denge.
    setToken("");
    setUser(null);
    localStorage.removeItem("token");
  };

  const fetchMe = async () => { // jab app load hota hai to hum is function ko call karenge, taki agar user already logged in hai to uska data fetch kar sake. is function me hum token check karenge, agar token available hai to hum /auth/me endpoint ko call karenge, aur user data fetch karenge. agar token invalid hai ya fetch me error aata hai to hum logout kar denge, taki user ko dobara login karna pade.
    try {
      if (!token) {
        setLoading(false);
        return;
      }
      const res = await api.get("/auth/me");
      setUser(res.data.user);
    } catch (error) { // agar error aata hai to logout kar denge, taki user ko dobara login karna pade.
      logout();
    } finally {
      setLoading(false); // finally block me loading false kar denge, chahe fetch successful ho ya error aaye. taki app ko pata chale ki user data fetch ho chuka hai, aur loading state false ho jaye.
    }
  };

  useEffect(() => { // jab app load hota hai to fetchMe function ko call karenge, taki agar user already logged in hai to uska data fetch kar sake.
    fetchMe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, fetchMe }}> 
      {children}
    </AuthContext.Provider>
  ); //AuthContext.Provider component ke through hum user, token, loading, login, logout, fetchMe functions ko poori app me available karwa rahe hain. jahan bhi useAuth hook ka use karenge, wahan ye data available hoga.
};

export const useAuth = () => useContext(AuthContext);