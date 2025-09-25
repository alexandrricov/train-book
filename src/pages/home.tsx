import { ChartSection } from "../sections/chart-section";
import { useEffect, useMemo, useState } from "react";
import { createItemForCurrentUser, subscribeTargets } from "../firebase-db";
import { Input } from "../components/input";
import { Select } from "../components/select";
import { Button } from "../components/action";
import { toDateString } from "../utils/date";

import { subscribeTodayItems } from "../firebase-db";
import type { ExerciseType, SetRow, TargetsAsOf } from "../types";
import { EXERCISE, EXERCISE_ORDER } from "../exercises";
import { ProgressIcon, type IconName } from "../components/icon";

export function Home() {
  return (
    <div>
      <h1 className="sr-only">TrainBook</h1>
      <AddSection />
      <TodayProgress />
      <ChartSection />
    </div>
  );
}

function AddSection() {
  const [exType, setExType] = useState<ExerciseType>(
    EXERCISE_ORDER[0] || "pushup"
  );
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  return (
    <section className="p-4 rounded-2xl shadow-sm border mb-6">
      <h2 className="font-semibold mb-3">Add set</h2>
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
        <Button type="submit" variation="primary" disabled={loading}>
          Add
        </Button>
      </form>
    </section>
  );
}

export function TodayProgress() {
  const [items, setItems] = useState<SetRow[]>([]);
  const [targets, setTargets] = useState<TargetsAsOf>({});

  useEffect(() => {
    const unsubItems = subscribeTodayItems(setItems);

    return () => {
      unsubItems();
    };
  }, []);

  useEffect(() => {
    const unsubItems = subscribeTargets(toDateString(), setTargets);

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
      <h2 className="font-semibold mb-3">Today's Progress</h2>
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
            .map(([type, counts]) => {
              const exercice = EXERCISE[type as ExerciseType];
              const total = counts.reduce((a, b) => a + b, 0);
              const target = targets[type as ExerciseType]?.value;

              return (
                <li key={type} className="mb-2 flex items-center gap-2">
                  <span className="font-medium">
                    {EXERCISE[type as ExerciseType].label}:
                  </span>
                  {counts.join(", ")} (Total: {total}
                  {target ? ` / ${target}` : ""})
                  {target && (
                    <ProgressIcon
                      name={type as IconName}
                      progress={total / target}
                      style={{ color: exercice.color }}
                      className="ml-auto"
                      size={40}
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
