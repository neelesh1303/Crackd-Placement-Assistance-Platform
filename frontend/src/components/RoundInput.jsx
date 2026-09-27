// This component represents a single round input form in the experience creation/editing process. It allows users to input details about each round of the interview process, such as round number, type, description, problems asked, topics covered, and duration. The component also provides a button to remove the round from the experience.

function RoundInput({ round, onChange, onRemove, index }) {
  return (
    <div className="mb-6 rounded-xl border border-white/10 bg-[#1e2527] p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
        <h4 className="text-sm font-bold text-teal-300 flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-500/20 text-xs text-teal-300">
            {index + 1}
          </span>
          Round {index + 1}
        </h4>
        <button
          type="button"
          onClick={onRemove}
          className="text-xs font-semibold text-rose-400 hover:text-rose-300 transition"
        >
          ✕ Remove Round
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-400">Round Number</label>
          <input
            type="number"
            placeholder="Round No"
            value={round.roundNo}
            onChange={(e) => onChange("roundNo", Number(e.target.value))}
            className="rounded-lg border border-white/10 bg-[#161d1f] px-3 py-2 text-sm text-slate-200"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-400">Round Type</label>
          <select
            value={round.type}
            onChange={(e) => onChange("type", e.target.value)}
            className="rounded-lg border border-white/10 bg-[#161d1f] px-3 py-2 text-sm text-slate-200"
          >
            <option value="OA">OA (Online Assessment)</option>
            <option value="DSA">DSA Round</option>
            <option value="LLD">LLD / System Design</option>
            <option value="HR">HR Round</option>
            <option value="Technical">Technical Interview</option>
            <option value="Managerial">Managerial Round</option>
          </select>
        </div>
      </div>

      <div className="mt-3">
        <label className="mb-1 block text-xs font-medium text-slate-400">Description / Experience Notes</label>
        <textarea
          placeholder="What was asked in this round? Format, difficulty, focus areas..."
          value={round.description}
          onChange={(e) => onChange("description", e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-white/10 bg-[#161d1f] px-3 py-2 text-sm text-slate-200"
        />
      </div>

      <div className="mt-3">
        <label className="mb-1 block text-xs font-medium text-slate-400">Coding Problems Asked (comma-separated)</label>
        <input
          type="text"
          placeholder="e.g. Merge Intervals, Two Sum, Course Schedule"
          value={(round.problemsAsked || []).join(", ")}
          onChange={(e) =>
            onChange(
              "problemsAsked",
              e.target.value.split(",").map((p) => p.trim())
            )
          }
          className="w-full rounded-lg border border-white/10 bg-[#161d1f] px-3 py-2 text-sm text-slate-200 font-mono"
        />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-400">Topics Covered (comma-separated)</label>
          <input
            type="text"
            placeholder="e.g. Arrays, Greedy, Dynamic Programming"
            value={(round.topics || []).join(", ")}
            onChange={(e) =>
              onChange(
                "topics",
                e.target.value.split(",").map((t) => t.trim())
              )
            }
            className="w-full rounded-lg border border-white/10 bg-[#161d1f] px-3 py-2 text-sm text-slate-200"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-400">Round Duration</label>
          <input
            type="text"
            placeholder="e.g. 1 hour, 45 mins"
            value={round.duration}
            onChange={(e) => onChange("duration", e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-[#161d1f] px-3 py-2 text-sm text-slate-200"
          />
        </div>
      </div>
    </div>
  );
}

export default RoundInput;