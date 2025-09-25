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
        className="flex gap-x-2 gap-y-4 flex-col sm:flex-row"
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
          name="date"
          required
          className="basis-1/1"
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
          name="type"
          required
          className="basis-1/1"
        >
          Exercise Type
        </Select>

        <Input
          type="number"
          value={count || ""}
          onChange={(e) => setCount(Number(e.target.value))}
          min={1}
          name="count"
          required
          className="basis-1/1"
        >
          Count
        </Input>
        <Button
          type="submit"
          variation="primary"
          disabled={loading}
          className="w-full sm:w-auto"
        >
          Add
        </Button>
      </form>
    </section>
  );
}
