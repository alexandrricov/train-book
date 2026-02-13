import { useEffect, useMemo, useState } from "react";
import { createItemForCurrentUser, subscribeTargets } from "../firebase-db";
import { toDateString } from "../utils/date";

import { subscribeItems } from "../firebase-db";
import type { ExerciseType, SetRow, SetRowDB, TargetsAsOf } from "../types";
import { EXERCISE, EXERCISE_ORDER } from "../exercises";
import { ProgressIcon, type IconName } from "../components/icon";
import { Select } from "../components/select";
import { Input } from "../components/input";
import { Button } from "../components/action";

export function Home() {
  return (
    <div className="flex flex-col min-h-full">
      <h1 className="sr-only">TrainBook</h1>
      <div className="max-sm:order-last max-sm:sticky max-sm:bottom-0 max-sm:mt-auto max-sm:-mx-4 max-sm:px-4 max-sm:py-3 max-sm:bg-canvas max-sm:border-t max-sm:border-border sm:section sm:mb-6">
        <AddForm />
      </div>
      <TodayProgress />
    </div>
  );
}

function AddForm() {
  const [exType, setExType] = useState<ExerciseType>(
    EXERCISE_ORDER[0] || "pushup"
  );
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  return (
    <form
      className="flex gap-3 items-end"
      onSubmit={(e) => {
        e.preventDefault();
        setLoading(true);

        createItemForCurrentUser({
          date: toDateString(),
          type: exType,
          count,
        } as SetRow)
          .then(() => {
            setCount(0);
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
        name="type"
      >
        Exercise Type
      </Select>

      <Input
        type="number"
        inputMode="numeric"
        value={count || ""}
        onChange={(e) => setCount(Number(e.target.value))}
        min={1}
        required
        className="basis-1/1"
        name="count"
      >
        Count
      </Input>
      <Button type="submit" variation="primary" disabled={loading}>
        Add
      </Button>
    </form>
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
        <p className="text-muted">No exercises logged today.</p>
      ) : (
        <ul>
          {groupedItems.map(([type, exercises]) => {
            const exercise = EXERCISE[type as ExerciseType];
            const total = exercises.reduce((a, b) => a + b.count, 0);
            const target = targets[type as ExerciseType]?.value;

            return (
              <li key={type} className="not-last:mb-4">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{exercise.label}</span>
                  <span className="ml-auto tabular-nums text-sm">
                    {total}
                    {target ? ` / ${target}` : ""}
                  </span>
                  <ProgressIcon
                    name={type as IconName}
                    progress={target ? total / target : 0}
                    style={{ color: exercise.color }}
                    size={32}
                  />
                </div>
                {target && (
                  <div className="mt-1.5 h-1.5 rounded-full overflow-hidden bg-border/30">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(100, (total / target) * 100)}%`,
                        backgroundColor: exercise.color,
                      }}
                    />
                  </div>
                )}
                <p className="mt-1 text-sm opacity-50">
                  {exercises.map((c) => c.count).join(" · ")}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
