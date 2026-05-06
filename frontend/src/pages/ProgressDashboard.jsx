import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api"; // FIX: raw axios ki jagah configured api instance use karo
import ChecklistItem from "../components/ChecklistItem";
import ReadinessBar from "../components/ReadinessBar";
import StreakDisplay from "../components/StreakDisplay";
import CompanyLabel from "../components/CompanyLabel";

const ProgressDashboard = () => {
  const [tracker, setTracker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // FIX: readiness aur streak ab tracker object se directly nikalte hain
  // alag state nahi chahiye — tracker me pehle se hai
  const navigate = useNavigate();

  // tracker fetch karte hain — single call, baaki data usme hi hota hai
  useEffect(() => {
    const fetchData = async () => {
      try {
        // FIX: Promise.all hata diya — ek hi call me poora tracker data aata hai
        // /api/tracker GET endpoint me readiness aur streak already embedded hain
        // api instance use kar rahe hain jo automatically token header add karta hai
        const res = await api.get("/tracker");
        setTracker(res.data.tracker);
      } catch (err) {
        const status = err.response?.status;
        const msg = err.response?.data?.message || "Failed to load tracker";

        // 404 matlab tracker exist nahi karta — user ne roadmap save nahi kiya abhi tak
        // is case me error dikhane ki jagah user ko roadmap page pe bhejo
        if (status === 404) {
          setError("no_tracker"); // special flag — UI me alag message dikhega
        } else {
          setError(msg);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // checklist item ka state update karta hai aur tracker refresh karta hai
  const handleChecklistUpdate = async (index, newState) => {
    try {
      // api instance use kar rahe hain — token automatically add hoga
      const response = await api.put("/tracker/checklist", {
        topicIndex: index,
        newState,
      });

      // updated tracker se readiness aur streak bhi embedded aate hain
      setTracker(response.data.tracker);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update checklist");
    }
  };

  // loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-gray-500 text-lg">Loading your progress...</p>
      </div>
    );
  }

  // tracker nahi mila — user ko helpful message + roadmap page ka button dikhao
  // FIX: pehle sirf "No tracker found" text tha, user confuse hota tha
  if (error === "no_tracker") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 max-w-md text-center">
          <p className="text-5xl mb-4">📋</p>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            No Tracker Found
          </h2>
          <p className="text-gray-500 text-sm mb-6">
             "Save to Tracker" button click
            karo. Uske baad yahan tumhara progress track hoga.
          </p>
          <button
            onClick={() => navigate("/roadmap")}
            className="rounded-lg bg-slate-900 px-5 py-2 text-white text-sm hover:bg-slate-800 transition"
          >
            Roadmap Generate Karo →
          </button>
        </div>
      </div>
    );
  }

  // koi aur error aaya — generic message dikhao
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-red-500 text-center">{error}</p>
      </div>
    );
  }

  // tracker toh mila but checklist/weeklyPlan empty hai — edge case
  if (!tracker) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-gray-500">Tracker data nahi mila.</p>
      </div>
    );
  }

  // tracker se readiness aur streak directly nikalte hain — alag state nahi chahiye
  const readiness = tracker.readiness || null;
  const streak = tracker.streak || null;

  const companySlug = tracker?.target?.companySlug || "";
  const companyLabel = companySlug
    ? companySlug
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")
    : "General Preparation";

  return (
    <div className="min-h-screen bg-gray-50 p-6 bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0b1220] text-white">
      <div className="max-w-4xl mx-auto container-glass p-8">

        {/* Header */}
        <h1 className="text-4xl font-bold text-gray-900 mb-2">📈 Your Progress</h1>
        <p className="text-gray-600 mb-8">
          Track your placement readiness & maintain your streak
        </p>

        {/* Streak Section */}
        {streak && <StreakDisplay streak={streak} />}

        {/* Readiness Bar */}
        {readiness && <ReadinessBar readiness={readiness} />}

        {/* Company Roadmap Card - Clickable Navigation */}
        <div
          onClick={() => navigate(`/roadmap-details/${companySlug}`)}
          className="mt-8 cursor-pointer rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-slate-300 transition"
        >
          <div className="flex items-center justify-between">
            <div>
              <CompanyLabel name={companyLabel} className="mb-2" />
              {tracker?.target?.role && (
                <p className="text-sm text-gray-600 mt-2">
                  Role: <span className="font-semibold text-slate-800">{tracker.target.role}</span>
                </p>
              )}
            </div>
            <div className="text-3xl">→</div>
          </div>
          <p className="text-xs text-gray-500 mt-3">Click to view full roadmap details</p>
        </div>

        {/* Checklist Section */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            📝 Study Checklist
          </h2>

          {/* checklist empty hai to message dikhao */}
          {tracker.checklist?.length === 0 ? (
            <p className="text-gray-500 text-sm">
              Checklist empty hai — roadmap me topics add karo.
            </p>
          ) : (
            <div className="space-y-3">
              {tracker.checklist.map((item, index) => (
                <ChecklistItem
                  key={index}
                  item={item}
                  index={index}
                  onStateChange={handleChecklistUpdate}
                />
              ))}
            </div>
          )}
        </div>

        {/* Roadmap page pe wapas jaane ka option */}
        <div className="mt-8 pb-8">
          <button
            onClick={() => navigate("/roadmap")}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 transition"
          >
            ← Generate a New Roadmap?
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProgressDashboard;