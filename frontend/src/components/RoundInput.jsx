// This component represents a single round input form in the experience creation/editing process. It allows users to input details about each round of the interview process, such as round number, type, description, problems asked, topics covered, and duration. The component also provides a button to remove the round from the experience.

function RoundInput({ round, onChange, onRemove, index }) {
  return (
    <div className="sheet sheet-flat mb-5 p-5">
      <div className="mb-4 flex items-center justify-between border-b border-dashed border-[color:var(--ink-3)] pb-3">
        <h4 className="flex items-center gap-3 text-lg font-extrabold">
          <span className="circled mono text-sm">{String(index + 1).padStart(2, "0")}</span>
          Round {index + 1}
        </h4>
        <button
          type="button"
          onClick={onRemove}
          className="mono text-xs font-bold text-[color:var(--red)] hover:underline"
        >
          ✕ remove
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="field-label">Round number</label>
          <input
            type="number"
            placeholder="1"
            value={round.roundNo}
            onChange={(e) => onChange("roundNo", Number(e.target.value))}
            className="field"
          />
        </div>
        <div>
          <label className="field-label">Round type</label>
          <select
            value={round.type}
            onChange={(e) => onChange("type", e.target.value)}
            className="field"
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

      <div className="mt-4">
        <label className="field-label">What happened in this round?</label>
        <textarea
          placeholder="Format, difficulty, what they focused on, how it felt…"
          value={round.description}
          onChange={(e) => onChange("description", e.target.value)}
          rows={3}
          className="field"
        />
      </div>

      <div className="mt-4">
        <label className="field-label">Problems asked · comma separated</label>
        <input
          type="text"
          placeholder="Merge Intervals, Two Sum, Course Schedule"
          value={(round.problemsAsked || []).join(", ")}
          onChange={(e) =>
            onChange(
              "problemsAsked",
              e.target.value.split(",").map((p) => p.trim())
            )
          }
          className="field field-mono"
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="field-label">Topics · comma separated</label>
          <input
            type="text"
            placeholder="Arrays, Greedy, DP"
            value={(round.topics || []).join(", ")}
            onChange={(e) =>
              onChange(
                "topics",
                e.target.value.split(",").map((t) => t.trim())
              )
            }
            className="field"
          />
        </div>

        <div>
          <label className="field-label">Duration</label>
          <input
            type="text"
            placeholder="45 mins"
            value={round.duration}
            onChange={(e) => onChange("duration", e.target.value)}
            className="field"
          />
        </div>
      </div>
    </div>
  );
}

export default RoundInput;
