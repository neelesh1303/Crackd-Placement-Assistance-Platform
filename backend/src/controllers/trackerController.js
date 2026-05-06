// ye file trackerController ko define karti hai, jo ki users ke study plans aur progress ko track karne ke liye API endpoints provide karti hai.
// saveRoadmapToTracker: roadmap data ko database me save ya update karta hai (upsert pattern)
// getTracker: user ka tracker retrieve karta hai with readiness calculation
// updateChecklistItem: checklist items ke state ko update karta hai
// getStreak, getReadiness: streak aur readiness info return karte hain

const Tracker = require("../models/Tracker");

// ─── HELPER: Readiness calculate karta hai ───────────────────────────────────
// checklist me kitne topics "done" hain uske basis par percentage nikalta hai
function calculateReadiness(tracker) {
  const doneCount =
    tracker.checklist?.filter((item) => item.state === "done").length || 0;
  const totalCount = tracker.checklist?.length || 0;
  const percentage =
    totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  return {
    percentage,
    completedTopics: doneCount,
    totalTopics: totalCount,
    lastCalculated: new Date(),
  };
}

// ─── HELPER: Streak update karta hai daily activity ke basis par ─────────────
// agar aaj activity ki hai to streak badhta hai, warna reset hota hai
// FIX: const → let nahi kiya tha caller me, isliye crash hota tha — ab pure object modify karte hain
function updateStreak(tracker) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastActivity = tracker.streak?.lastActivityDate
    ? new Date(tracker.streak.lastActivityDate)
    : null;
  if (lastActivity) lastActivity.setHours(0, 0, 0, 0);

  // agar aaj already activity ho chuki hai to streak dobara mat badhao
  if (lastActivity?.getTime() === today.getTime()) return tracker;

  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

  if (lastActivity && lastActivity.getTime() === yesterday.getTime()) {
    // kal bhi activity thi — streak continue karo
    tracker.streak.current = (tracker.streak.current || 0) + 1;
  } else {
    // streak toot gayi — reset karo
    tracker.streak.current = 1;
  }

  // longest streak update karo agar current zyada hai
  if (tracker.streak.current > (tracker.streak.longest || 0)) {
    tracker.streak.longest = tracker.streak.current;
  }

  tracker.streak.lastActivityDate = new Date();
  return tracker;
}

// ─── saveRoadmapToTracker ─────────────────────────────────────────────────────
// FIX: Tracker.create() se Tracker.findOneAndUpdate() (upsert) pe switch kiya
// Pehle har baar naya tracker banta tha — ab user ka ek hi tracker hoga
// Agar pehle se hai to update hoga, nahi hai to naya banega
exports.saveRoadmapToTracker = async (req, res) => {
  try {
    const { meta, source, weeklyPlan, checklist } = req.body || {};

    if (!meta || !meta.role || !meta.weeks || !meta.hoursPerDay) {
      return res.status(400).json({ message: "Invalid roadmap payload" });
    }

    // upsert: user ka tracker pehle se hai to update karo, nahi to naya banao
    // ye ensure karta hai ki har user ka sirf ek hi active tracker ho
    const tracker = await Tracker.findOneAndUpdate(
      { user: req.user.id }, // is user ka tracker dhundo
      {
        $set: {
          user: req.user.id,
          target: {
            companySlug: meta.companySlug || "",
            role: meta.role,
            weeks: Number(meta.weeks),
            hoursPerDay: Number(meta.hoursPerDay),
          },
          source: source || "fallback",
          weeklyPlan: Array.isArray(weeklyPlan) ? weeklyPlan : [],
          checklist: Array.isArray(checklist) ? checklist : [],
          // naya roadmap save hone par streak aur readiness reset karte hain
          "streak.current": 0,
          "streak.longest": 0,
          "streak.lastActivityDate": null,
          "readiness.percentage": 0,
          "readiness.completedTopics": 0,
          "readiness.totalTopics": checklist?.length || 0,
          "readiness.lastCalculated": null,
        },
      },
      {
        new: true,      // updated document return karo
        upsert: true,   // nahi mila to naya banao
        setDefaultsOnInsert: true,
      }
    );

    return res.status(201).json({ success: true, tracker });
  } catch (error) {
    console.error("[tracker] saveRoadmapToTracker error:", error.message);
    return res.status(500).json({ message: error.message });
  }
};

// ─── getMyTrackers ────────────────────────────────────────────────────────────
// user ke saare trackers return karta hai (descending order by date)
exports.getMyTrackers = async (req, res) => {
  try {
    const trackers = await Tracker.find({ user: req.user.id }).sort({
      createdAt: -1,
    });
    return res.status(200).json({ success: true, trackers });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─── updateChecklistState ─────────────────────────────────────────────────────
// kisi specific topic ka state update karta hai: todo → in-progress → done
exports.updateChecklistState = async (req, res) => {
  try {
    const { trackerId, topic, state } = req.body;

    if (!["todo", "in-progress", "done"].includes(state)) {
      return res.status(400).json({ message: "Invalid state" });
    }

    const tracker = await Tracker.findOne({
      _id: trackerId,
      user: req.user.id,
    });
    if (!tracker) {
      return res.status(404).json({ message: "Tracker not found" });
    }

    const item = tracker.checklist.find(
      (c) => c.topic.toLowerCase() === String(topic || "").toLowerCase()
    );
    if (!item) {
      return res.status(404).json({ message: "Topic not found in checklist" });
    }

    item.state = state;
    // agar "done" mark hua hai to completedAt timestamp set karo
    if (state === "done" && !item.completedAt) {
      item.completedAt = new Date();
    }

    await tracker.save();
    return res.status(200).json({ success: true, tracker });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─── getTracker ───────────────────────────────────────────────────────────────
// user ka current tracker return karta hai with latest readiness calculation
// FIX: agar tracker nahi mila to seedha 404 return karo — crash nahi hoga
exports.getTracker = async (req, res) => {
  try {
    const tracker = await Tracker.findOne({ user: req.user.id });

    // tracker nahi mila — user ne abhi roadmap save nahi kiya
    // frontend ko clear message milega ki pehle roadmap generate karein
    if (!tracker) {
      return res.status(404).json({
        message: "No tracker found. Please generate and save a roadmap first.",
      });
    }

    // readiness recalculate karte hain fresh data ke liye
    tracker.readiness = calculateReadiness(tracker);
    await tracker.save();

    res.status(200).json({ success: true, tracker });
  } catch (error) {
    console.error("[tracker] getTracker error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// ─── updateChecklistItem ──────────────────────────────────────────────────────
// index-based checklist update — streak aur readiness bhi recalculate karta hai
// FIX: `const tracker` ko reassign karne ki koshish hoti thi — ab direct modify karte hain
exports.updateChecklistItem = async (req, res) => {
  try {
    const { topicIndex, newState } = req.body;

    // FIX: const ki jagah let use kiya taaki streak update assignment kaam kare
    let tracker = await Tracker.findOne({ user: req.user.id });
    if (!tracker) {
      return res.status(404).json({ message: "Tracker not found" });
    }

    // checklist item update karo agar valid index hai
    if (tracker.checklist[topicIndex]) {
      tracker.checklist[topicIndex].state = newState;

      // pehli baar "done" hua to completedAt set karo
      if (newState === "done" && !tracker.checklist[topicIndex].completedAt) {
        tracker.checklist[topicIndex].completedAt = new Date();
      }
    }

    // FIX: ab tracker = updateStreak(tracker) kaam karega kyunki let use kiya
    tracker = updateStreak(tracker);

    // readiness recalculate karo updated checklist ke basis par
    tracker.readiness = calculateReadiness(tracker);

    await tracker.save();
    res.status(200).json({ success: true, tracker });
  } catch (error) {
    console.error("[tracker] updateChecklistItem error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// ─── getStreak ────────────────────────────────────────────────────────────────
// sirf streak info return karta hai — progress page pe badge ke liye useful
exports.getStreak = async (req, res) => {
  try {
    const tracker = await Tracker.findOne({ user: req.user.id });
    if (!tracker) {
      return res.status(404).json({ message: "Tracker not found" });
    }

    res.status(200).json({
      success: true,
      streak: {
        current: tracker.streak?.current || 0,
        longest: tracker.streak?.longest || 0,
        lastActivityDate: tracker.streak?.lastActivityDate || null,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─── getReadiness ─────────────────────────────────────────────────────────────
// latest readiness percentage return karta hai — dashboard summary ke liye
exports.getReadiness = async (req, res) => {
  try {
    const tracker = await Tracker.findOne({ user: req.user.id });
    if (!tracker) {
      return res.status(404).json({ message: "Tracker not found" });
    }

    res.status(200).json({
      success: true,
      readiness: tracker.readiness || {
        percentage: 0,
        completedTopics: 0,
        totalTopics: 0,
        lastCalculated: null,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};