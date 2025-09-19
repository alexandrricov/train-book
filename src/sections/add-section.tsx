import { useState } from "react";
import { createItemForCurrentUser } from "../firebase-db";
import { SetRow } from "../types";
import { EXERCISE_LABELS, EXERCISE_ORDER } from "../exercises";

export function toLocalDateString(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const DEFAULT_EXERCISES = EXERCISE_ORDER;

export function AddSection() {
  const [exType, setExType] = useState<string>(
    DEFAULT_EXERCISES[0] || "pushup"
  );
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  // const [rows, setRows] = useState<SetRow[]>([]);
  const [date, setDate] = useState<string>(toLocalDateString());

  return (
    <section className="p-4 rounded-2xl shadow-sm border mb-6">
      <h2 className="text-lg font-semibold mb-3">Add set</h2>
      <form
        className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end"
        onSubmit={(e) => {
          e.preventDefault();
          setLoading(true);

          createItemForCurrentUser({
            date,
            type: exType,
            count,
          } as SetRow)
            .then(() => {
              setCount(0);
              // setExType(DEFAULT_EXERCISES[0] || "pushup");
              // setDate(toLocalDateString());
            })
            .finally(() => setLoading(false));
        }}
      >
        <label className="text-sm">
          Date
          <input
            type="date"
            className="mt-1 w-full border rounded-xl p-2"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
        <label className="text-sm">
          Exercise Type
          <select
            className="mt-1 w-full border rounded-xl p-2"
            value={exType}
            onChange={(e) => setExType(e.target.value)}
            required
          >
            {DEFAULT_EXERCISES.map((key) => (
              <option key={key} value={key}>
                {EXERCISE_LABELS[key] ?? key}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Count
          <input
            type="number"
            className="mt-1 w-full border rounded-xl p-2"
            value={count || ""}
            onChange={(e) => setCount(Number(e.target.value))}
            min={1}
            required
          />
        </label>
        <button
          type="submit"
          className="px-4 py-2 rounded-xl bg-blue-600 text-white disabled:opacity-50"
          disabled={loading}
        >
          Add
        </button>
      </form>
    </section>
  );
}
