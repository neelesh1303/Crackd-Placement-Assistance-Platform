//is file ka use React app ke main component ko define karne ke liye hota hai. yahan par hum React Router ka use karke different pages ke routes define karte hain, aur ProtectedRoute component ka use karke ensure karte hain ki kuch routes sirf authenticated users ke liye accessible hon. is file me hum Login, Register, Companies, AddExperience, aur Dashboard pages ke routes define karte hain, aur ek wildcard route bhi define karte hain jo kisi bhi undefined path ko /companies par redirect kar deta hai.

import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Companies from "./pages/Companies";
import AddExperience from "./pages/AddExperience";
import CompanyDetail from "./pages/CompanyDetail";
import RoadmapGenerator from "./pages/RoadmapGenerator";
import ProgressDashboard from "./pages/ProgressDashboard";
import RoadmapDetailsPage from "./pages/RoadmapDetailsPage";
import Dashboard from "./pages/Dashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} /> 
        <Route path="/register" element={<Register />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
  path="/add-experience"
  element={
    <ProtectedRoute>
      <AddExperience />
    </ProtectedRoute>
  }
/>

        <Route
          path="/companies"
          element={
            <ProtectedRoute>
              <Companies />
            </ProtectedRoute>
          }
        />
        <Route
path="/roadmap"
element={
<ProtectedRoute>
<RoadmapGenerator />
</ProtectedRoute>
}
/>
        <Route
path="/progress"
element={
<ProtectedRoute>
<ProgressDashboard />
</ProtectedRoute>
}
/>
        <Route
path="/roadmap-details/:companySlug"
element={
<ProtectedRoute>
<RoadmapDetailsPage />
</ProtectedRoute>
}
/>
        <Route
  path="/companies/:slug"
  element={
    <ProtectedRoute>
      <CompanyDetail />
    </ProtectedRoute>
  }
/>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;