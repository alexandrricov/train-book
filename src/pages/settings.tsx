import { useEffect, useState } from "react";
import { Button } from "../components/action";
import { Input } from "../components/input";
import { Select } from "../components/select";
import { EXERCISE, EXERCISE_ORDER } from "../exercises";
import {
  exportMyItemsToJSON,
  importMyItemsFromJSON,
  setTarget,
  subscribeTargets,
} from "../firebase-db";
import type { ExerciseType, TargetsAsOf } from "../types";
import { toDateString } from "../utils/date";

export function Settings() {
  return (
    <>
      <h1 className="text-xl font-bold mb-4">Settings</h1>

      <Targets />

      <section>
        <h2 className="font-semibold mb-3">Import/Export data</h2>
        <div className="flex items-center gap-2 mt-6">
          <Button variation="secondary" onClick={() => exportMyItemsToJSON()}>
            Export Items
          </Button>
          <label>
            Import Items
            <input
              type="file"
              name="import"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  importMyItemsFromJSON(file, {
                    mode: "append",
                    preserveIds: true,
                    reassignCreatedAt: false,
                  });
                }
              }}
            />
          </label>
        </div>
      </section>
    </>
  );
}

function Targets() {
  const [exType, setExType] = useState<ExerciseType>(
    EXERCISE_ORDER[0] || "pushup"
  );
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const [items, setItems] = useState<TargetsAsOf>({});

  useEffect(() => {
    const unsubItems = subscribeTargets(toDateString(), setItems);

    return () => {
      unsubItems();
    };
  }, []);

  return (
    <section className="mb-6">
      <h2 className="mb-3 font-semibold">Targets</h2>
      {EXERCISE_ORDER.map((ex) => (
        <div key={ex} className="mb-4">
          {EXERCISE[ex].label}: {items[ex]?.value ?? "not set"}
        </div>
      ))}

      <form
        className="flex gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          setLoading(true);
          setTarget(exType, count)
            .then(() => {
              setCount(0);
              // setExType(DEFAULT_EXERCISES[0] || "pushup");
              // setDate(toLocalDateString());
            })
            .finally(() => setLoading(false));
        }}
      >
        <Select
          value={exType}
          onChange={(e) => setExType(e.target.value as ExerciseType)}
          options={EXERCISE_ORDER.map((key) => ({
            children: EXERCISE[key].label,
            value: key,
          }))}
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
          required
          className="basis-1/1"
        >
          Count
        </Input>
        <Button
          type="submit"
          variation="primary"
          disabled={loading}
          className="text-nowrap"
        >
          Save Targets
        </Button>
      </form>
    </section>
  );
}
