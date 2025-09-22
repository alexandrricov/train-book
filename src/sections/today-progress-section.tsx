import { useEffect, useMemo, useState } from "react";
import { subscribeTodayItems } from "../firebase-db";
import type { ExerciseType, SetRow } from "../types";
import { EXERCISE, EXERCISE_ORDER } from "../exercises";

export function TodayProgress() {
  const [items, setItems] = useState<SetRow[]>([]);

  useEffect(() => {
    const unsubItems = subscribeTodayItems(setItems);

    return () => {
      unsubItems();
    };
  }, []);

  const groupedItems = useMemo(() => {
    return items.reduce((acc, item) => {
      if (!acc[item.type]) acc[item.type] = [];
      acc[item.type].push(item.count);
      return acc;
    }, {} as Record<ExerciseType, SetRow["count"][]>);
  }, [items]);

  return (
    <section className="p-4 rounded-2xl shadow-sm border mb-6">
      <h2 className="text-lg font-semibold mb-3">Today's Progress</h2>
      {Object.entries(groupedItems).length === 0 ? (
        <p className="text-gray-500">No exercises logged today.</p>
      ) : (
        <ul className="list-disc pl-5">
          {Object.entries(groupedItems)
            .sort(([a], [b]) => {
              const orderA = EXERCISE_ORDER.indexOf(a as ExerciseType);
              const orderB = EXERCISE_ORDER.indexOf(b as ExerciseType);
              return orderA - orderB;
            })
            .map(([type, counts]) => (
              <li key={type}>
                <span className="font-medium">
                  {EXERCISE[type as ExerciseType].label}
                </span>
                : {counts.join(", ")} (Total:{" "}
                {counts.reduce((a, b) => a + b, 0)})
              </li>
            ))}
        </ul>
      )}
    </section>
  );
}
