import { ChartSection } from "../sections/chart-section";
import { useEffect, useMemo, useState } from "react";
import { subscribeTargets } from "../firebase-db";
import { toDateString } from "../utils/date";

import { subscribeItems } from "../firebase-db";
import type { ExerciseType, SetRowDB, TargetsAsOf } from "../types";
import { EXERCISE, EXERCISE_ORDER } from "../exercises";
import { ProgressIcon, type IconName } from "../components/icon";

export function Home() {
  return (
    <div>
      <h1 className="sr-only">TrainBook</h1>
      <TodayProgress />
      <ChartSection />
    </div>
  );
}

export function TodayProgress() {
  const [items, setItems] = useState<SetRowDB[]>([]);
  const [targets, setTargets] = useState<TargetsAsOf>({});

  useEffect(() => {
    const unsubscribe = subscribeItems(setItems, toDateString(new Date()));

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const unsubItems = subscribeTargets(toDateString(), setTargets);

    return () => {
      unsubItems();
    };
  }, []);

  const groupedItems: [ExerciseType, SetRowDB[]][] = useMemo(() => {
    const _ = Object.groupBy(items, (i) => i.type);

    return Object.entries(_)
      .sort(([a], [b]) => {
        const orderA = EXERCISE_ORDER.indexOf(a as ExerciseType);
        const orderB = EXERCISE_ORDER.indexOf(b as ExerciseType);
        return orderA - orderB;
      })
      .map(([k, v]) => {
        return [
          k as ExerciseType,
          v.sort(
            (a, b) =>
              a.createdAt?.toDate().getTime() - b.createdAt?.toDate().getTime()
          ),
        ];
      });
  }, [items]);

  return (
    <section className="p-4 rounded-2xl border border-border mb-6">
      <h2 className="text-h2 mb-3">Today's Progress</h2>
      {groupedItems.length === 0 ? (
        <p className="text-gray-500">No exercises logged today.</p>
      ) : (
        <ul>
          {groupedItems.map(([type, exercises]) => {
            const exercise = EXERCISE[type as ExerciseType];
            const total = exercises.reduce((a, b) => a + b.count, 0);
            const target = targets[type as ExerciseType]?.value;

            return (
              <li key={type} className="not-last:mb-2 flex items-center gap-2">
                <span className="font-medium">
                  {EXERCISE[type as ExerciseType].label}:
                </span>
                {exercises
                  .sort(
                    (a, b) =>
                      a.createdAt?.toDate().getTime() -
                      b.createdAt?.toDate().getTime()
                  )
                  .map((c) => c.count)
                  .join(", ")}{" "}
                ({total}
                {target ? ` / ${target}` : ""})
                {target && (
                  <ProgressIcon
                    name={type as IconName}
                    progress={total / target}
                    style={{ color: exercise.color }}
                    className="ml-auto"
                    size={32}
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
