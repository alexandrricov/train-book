import { useEffect, useMemo, useState } from "react";
import { type ExerciseType, type SetRow } from "../types";
import { subscribeMyItems } from "../firebase-db";
import { EXERCISE_LABELS, EXERCISE_ORDER } from "../exercises";

export function ListSection() {
  const [items, setItems] = useState<SetRow[]>([]);

  useEffect(() => {
    const unsubItems = subscribeMyItems(setItems);

    return () => {
      unsubItems();
    };
  }, []);

  const groupedItems = useMemo(() => {
    return items.reduce((acc, item) => {
      if (!acc[item.date])
        acc[item.date] = {} as Record<ExerciseType, SetRow["count"][]>;
      if (!acc[item.date][item.type]) acc[item.date][item.type] = [];
      acc[item.date][item.type].push(item.count);
      return acc;
    }, {} as Record<string, Record<ExerciseType, SetRow["count"][]>>);
  }, [items]);

  // every day from today to smallest date
  const days = useMemo(() => {
    if (items.length === 0) return [];
    const dateStrings = Object.keys(groupedItems);
    const minDate = dateStrings.reduce(
      (min, d) => (d < min ? d : min),
      dateStrings[0]
    );
    const today = new Date();
    const min = new Date(minDate);
    const result: string[] = [];
    for (let d = new Date(today); d >= min; d.setDate(d.getDate() - 1)) {
      const iso = d.toISOString().slice(0, 10);
      result.push(iso);
    }
    return result;
  }, [items, groupedItems]);

  if (items.length === 0) return <div>No items yet</div>;

  return (
    <section className="mt-10">
      <h2 className="text-xl font-bold mb-4">My Exercises</h2>
      {days.length === 0 && <div>No items yet</div>}
      {days.map((d) => (
        <div key={d} className="mb-6">
          <h3 className="text-lg font-semibold mb-2">{d}</h3>
          {groupedItems[d] ? (
            <ul className="list-disc pl-5">
              {Object.entries(groupedItems[d])
                .sort(([a], [b]) => {
                  const orderA = EXERCISE_ORDER.indexOf(a as ExerciseType);
                  const orderB = EXERCISE_ORDER.indexOf(b as ExerciseType);
                  return orderA - orderB;
                })
                .map(([type, counts]) => (
                  <li key={type}>
                    {EXERCISE_LABELS[type as ExerciseType] ?? type}:{" "}
                    {counts.join(", ")} = {counts.reduce((a, b) => a + b, 0)}
                  </li>
                ))}
            </ul>
          ) : (
            <div>No exercises logged</div>
          )}
        </div>
      ))}
    </section>
  );
}
