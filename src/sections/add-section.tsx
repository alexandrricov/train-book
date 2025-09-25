import { useState } from "react";
import { createItemForCurrentUser } from "../firebase-db";
import { type SetRow } from "../types";
import { EXERCISE, EXERCISE_ORDER } from "../exercises";
import { Input } from "../components/input";
import { Select } from "../components/select";
import { Button } from "../components/action";
import { toDateString } from "../utils/date";

export function AddSection() {
  const [exType, setExType] = useState<string>(EXERCISE_ORDER[0] || "pushup");
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState<string>(toDateString());

  return (
    <section className="p-4 rounded-2xl shadow-sm border mb-6">
      <h2 className="font-semibold mb-3">Add set</h2>
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
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          min={1}
          required
        >
          Date
        </Input>
        <Select
          value={exType}
          onChange={(e) => setExType(e.target.value)}
          options={EXERCISE_ORDER.map((key) => ({
            children: EXERCISE[key].label,
            value: key,
          }))}
          required
        >
          Exercise Type
        </Select>

        <Input
          type="number"
          value={count || ""}
          onChange={(e) => setCount(Number(e.target.value))}
          min={1}
          required
        >
          Count
        </Input>
        <Button type="submit" variation="primary" disabled={loading}>
          Add
        </Button>
      </form>
    </section>
  );
}
