// This component represents a single round input form in the experience creation/editing process. It allows users to input details about each round of the interview process, such as round number, type, description, problems asked, topics covered, and duration. The component also provides a button to remove the round from the experience.

function RoundInput({ round, onChange, onRemove, index }) {
  return (
    <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="mb-4 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-900">Round {index + 1}</h4>
        <button
          type="button"
          onClick={onRemove}
          className="text-xs font-medium text-red-600 hover:text-red-700"
        >
          Remove
        </button>
      </div>
      

      <div className="grid gap-3 sm:grid-cols-2">
        <input
          type="number"
          placeholder="Round No"
          value={round.roundNo}
          onChange={(e) => onChange("roundNo", Number(e.target.value))} //roundNo input field ke value ko round.roundNo se bind kiya gaya hai, aur onChange event me setRound function call karke roundNo property update kiya jata hai. Number() function ka use karke input value ko number me convert kiya jata hai, taki roundNo hamesha ek number ho, jo ki data consistency ke liye important hai.
          className="rounded border border-slate-300 px-3 py-2 text-sm"
        />
        <select
          value={round.type}
          onChange={(e) => onChange("type", e.target.value)} //type select field ke value ko round.type se bind kiya gaya hai, aur onChange event me setRound function call karke type property update kiya jata hai. isse jab user type select karega to round object me uska type update ho jayega, jisse hum experience create/edit karte waqt har round ke type ko track kar sakte hain.
          className="rounded border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="OA">OA</option>
          <option value="DSA">DSA</option>
          <option value="LLD">LLD</option>
          <option value="HR">HR</option>
          <option value="Technical">Technical</option>
          <option value="Managerial">Managerial</option>
        </select>
      </div>

      <textarea
        placeholder="Description"
        value={round.description}
        onChange={(e) => onChange("description", e.target.value)} //description textarea ke value ko round.description se bind kiya gaya hai, aur onChange event me setRound function call karke description property update kiya jata hai.
        className="mt-3 w-full rounded border border-slate-300 px-3 py-2 text-sm"
      />

      <input
        type="text"
        placeholder="Problems asked (comma-separated)"
        value={(round.problemsAsked || []).join(", ")}
        onChange={(e) =>
          onChange(
            "problemsAsked",
            e.target.value.split(",").map((p) => p.trim())
          )
        }
        className="mt-3 w-full rounded border border-slate-300 px-3 py-2 text-sm"
      />

      <input
        type="text"
        placeholder="Topics (comma-separated)"
        value={(round.topics || []).join(", ")} //round.topics array ko comma-separated string me convert kiya jata hai, taki wo input field me dikhai de. agar round.topics undefined hai to default empty array use kiya jayega, taki join() method error na de.
        onChange={(e) => //e is event object, jisme target property hoti hai jo input field ko represent karti hai. uske value property me user ke input ki current value hoti hai. jab user input field me kuch type karega to onChange event trigger hoga, aur e.target.value me updated input value milegi. is value ko split(",") karke comma ke basis par array me convert kiya jata hai, aur map() method ka use karke har topic ko trim() karke extra spaces remove kiya jata hai. isse round.topics property me ek clean array of topics store hoga, jo ki data consistency ke liye important hai.
          onChange(
            "topics",
            e.target.value.split(",").map((t) => t.trim())
          )
        }
        className="mt-3 w-full rounded border border-slate-300 px-3 py-2 text-sm"
      />

      <input
        type="text"
        placeholder="Duration"
        value={round.duration} //round.duration input field ke value ko round.duration se bind kiya gaya hai, aur onChange event me setRound function call karke duration property update kiya jata hai. isse jab user duration input field me kuch type karega to round object me uska duration update ho jayega, jisse hum experience create/edit karte waqt har round ke duration ko track kar sakte hain.
        onChange={(e) => onChange("duration", e.target.value)}
        className="mt-3 w-full rounded border border-slate-300 px-3 py-2 text-sm"
      />
    </div>
  );
}

export default RoundInput;