/*
If user logged in (token exists) → show page
If not logged in → redirect to login
*/



import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { Loader } from "./Bits";

const ProtectedRoute = ({ children }) => { //children is the protected component . if user is valid from token and loading is false, then we will show the children component. otherwise we will redirect to login page.
  const { token, user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="page"><Loader label="Finding your notebook" /></div>; //Jab tak check complete nahi hua: UI block karo varna flicker hoga (unauthorized → authorized)
  // Token alone is not enough — it must have been verified by the server (/auth/me returned a user).
  if (!token || !user) return <Navigate to="/login" replace state={{ from: location }} />;

  return children;
};

export default ProtectedRoute;