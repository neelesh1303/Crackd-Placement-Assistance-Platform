/*
If user logged in (token exists) → show page
If not logged in → redirect to login
*/



import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children }) => { //children is the protected component . if user is valid from token and loading is false, then we will show the children component. otherwise we will redirect to login page.
  const { token, loading } = useAuth();

  if (loading) return <div className="p-4">Loading...</div>; //Jab tak check complete nahi hua: UI block karo varna flicker hoga (unauthorized → authorized)
  if (!token) return <Navigate to="/login" replace />;

  return children;
};

export default ProtectedRoute;