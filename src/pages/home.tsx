import { useEffect, useMemo, useRef, useState } from "react";
import { createItemForCurrentUser, subscribeTargets } from "../firebase-db";
import { toDateString } from "../utils/date";

import { subscribeItems } from "../firebase-db";
import type { ExerciseType, SetRow, SetRowDB, TargetsAsOf } from "../types";
import { EXERCISE, EXERCISE_ORDER } from "../exercises";
import { Icon, ProgressIcon, type IconName } from "../components/icon";
import { Button } from "../components/action";
import { useAddVariant } from "./home-variant";

const LS_KEY_LAST_TYPE = "trainbook:lastExerciseType";

function loadLastType(): ExerciseType {
  const stored =
    typeof window !== "undefined"
      ? window.localStorage.getItem(LS_KEY_LAST_TYPE)
      : null;
  if (stored && EXERCISE_ORDER.includes(stored as ExerciseType)) {
    return stored as ExerciseType;
  }
  return EXERCISE_ORDER[0] || "pushup";
}

function saveLastType(type: ExerciseType) {
  window.localStorage.setItem(LS_KEY_LAST_TYPE, type);
}

function useTodayData() {
  const [items, setItems] = useState<SetRowDB[]>([]);
  const [targets, setTargets] = useState<TargetsAsOf>({});

  useEffect(() => {
    const unsubscribe = subscribeItems(setItems, toDateString(new Date()));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubItems = subscribeTargets(toDateString(), setTargets);
    return () => unsubItems();
  }, []);

  const totalsByType = useMemo(() => {
    const totals: Partial<Record<ExerciseType, number>> = {};
    for (const item of items) {
      totals[item.type] = (totals[item.type] ?? 0) + item.count;
    }
    return totals;
  }, [items]);

  const countsByType = useMemo(() => {
    const grouped: Partial<Record<ExerciseType, number[]>> = {};
    const sorted = [...items].sort(
      (a, b) =>
        (a.createdAt?.toDate().getTime() ?? 0) -
        (b.createdAt?.toDate().getTime() ?? 0),
    );
    for (const item of sorted) {
      (grouped[item.type] ??= []).push(item.count);
    }
    return grouped;
  }, [items]);

  return { items, targets, totalsByType, countsByType };
}

async function submitExercise(type: ExerciseType, count: number) {
  if (!count || count < 1) return;
  await createItemForCurrentUser({
    date: toDateString(),
    type,
    count,
  } as SetRow);
  saveLastType(type);
}

export function Home() {
  const [variant] = useAddVariant();

  return (
    <div className="flex flex-col min-h-full gap-6">
      <h1 className="sr-only">TrainBook</h1>

      {variant === "A" && (
        <>
          <VariantA />
          <TodayProgress />
        </>
      )}

      {variant === "B" && <VariantB />}

      {variant === "C" && (
        <>
          <VariantC />
          <TodayProgress />
        </>
      )}
    </div>
  );
}

function VariantA() {
  const [exType, setExType] = useState<ExerciseType>(loadLastType);
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const exercise = EXERCISE[exType];

  function updateType(t: ExerciseType) {
    setExType(t);
    saveLastType(t);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!count) return;
    setLoading(true);
    submitExercise(exType, count)
      .then(() => setCount(0))
      .finally(() => setLoading(false));
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 rounded-2xl border border-border flex flex-col gap-4"
    >
      <div className="grid grid-cols-4 gap-2">
        {EXERCISE_ORDER.map((key) => {
          const ex = EXERCISE[key];
          const active = key === exType;
          return (
            <button
              key={key}
              type="button"
              onClick={() => updateType(key)}
              className="flex flex-col items-center gap-1 py-3 rounded-xl border transition-all"
              style={{
                borderColor: active ? ex.color : "transparent",
                backgroundColor: active
                  ? `${ex.color}22`
                  : "var(--color-canvas2)",
                color: active ? ex.color : "var(--color-canvas-text)",
              }}
              aria-pressed={active}
              aria-label={ex.label}
            >
              <Icon name={key as IconName} size={24} />
              <span className="text-xs font-medium">{ex.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-center gap-3">
        <div className="flex items-center gap-2 basis-full justify-center">
          <button
            type="button"
            onClick={() => setCount((c) => Math.max(0, c - 10))}
            className="w-12 h-12 rounded-full bg-canvas2 flex items-center justify-center text-base font-medium tabular-nums active:scale-95 transition-transform"
            aria-label="Subtract 10"
            disabled={count === 0}
          >
            -10
          </button>
          <button
            type="button"
            onClick={() => setCount((c) => Math.max(0, c - 1))}
            className="w-12 h-12 rounded-full bg-canvas2 flex items-center justify-center text-2xl active:scale-95 transition-transform"
            aria-label="Decrement"
            disabled={count === 0}
          >
            -
          </button>
        </div>
        <input
          type="number"
          inputMode="numeric"
          value={count || ""}
          onChange={(e) => setCount(Number(e.target.value))}
          placeholder="0"
          min={0}
          className="w-24 text-center text-[48px] font-semibold tabular-nums bg-transparent outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
          aria-label="Count"
        />
        <div className="flex items-center gap-2 basis-full justify-center">
          <button
            type="button"
            onClick={() => setCount((c) => c + 1)}
            className="w-12 h-12 rounded-full bg-canvas2 flex items-center justify-center text-2xl active:scale-95 transition-transform"
            aria-label="Increment"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => setCount((c) => c + 10)}
            className="w-12 h-12 rounded-full bg-canvas2 flex items-center justify-center text-base font-medium tabular-nums active:scale-95 transition-transform"
            aria-label="Add 10"
          >
            +10
          </button>
        </div>
      </div>

      <Button
        type="submit"
        variation="primary"
        size="large"
        disabled={loading || !count}
        className="w-full"
        style={{
          backgroundColor: exercise.color,
        }}
      >
        {loading ? "Adding…" : `Add ${exercise.label}`}
      </Button>
    </form>
  );
}

function VariantB() {
  const { targets, totalsByType, countsByType } = useTodayData();

  return (
    <ul className="flex flex-col gap-3">
      {EXERCISE_ORDER.map((key) => (
        <VariantBTile
          key={key}
          exType={key}
          total={totalsByType[key] ?? 0}
          target={targets[key]?.value}
          sets={countsByType[key] ?? []}
        />
      ))}
    </ul>
  );
}

function VariantBTile({
  exType,
  total,
  target,
  sets,
}: {
  exType: ExerciseType;
  total: number;
  target?: number;
  sets: number[];
}) {
  const exercise = EXERCISE[exType];
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const progress = target ? Math.min(1, total / target) : 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!count) return;
    setLoading(true);
    submitExercise(exType, count)
      .then(() => {
        setCount(0);
        inputRef.current?.blur();
      })
      .finally(() => setLoading(false));
  }

  return (
    <li>
      <form
        onSubmit={handleSubmit}
        className="p-4 rounded-2xl border border-border flex flex-col gap-3"
        style={{
          borderColor: count > 0 ? exercise.color : undefined,
        }}
      >
        <div className="flex items-center gap-3">
          <ProgressIcon
            name={exType as IconName}
            progress={progress}
            size={40}
            style={{ color: exercise.color }}
          />
          <div className="flex-1 min-w-0">
            <p className="font-medium">{exercise.label}</p>
            {sets.length > 0 && (
              <p className="text-xs text-muted truncate">{sets.join(" · ")}</p>
            )}
          </div>
          <span className="tabular-nums text-sm text-muted">
            {total}
            {target ? ` / ${target}` : ""}
          </span>
        </div>

        {target && (
          <div className="h-1.5 rounded-full overflow-hidden bg-border/30">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${progress * 100}%`,
                backgroundColor: exercise.color,
              }}
            />
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="number"
            inputMode="numeric"
            value={count || ""}
            onChange={(e) => setCount(Number(e.target.value))}
            placeholder="Add reps…"
            min={0}
            className="flex-1 px-3 py-3 rounded-lg bg-canvas2 text-lg tabular-nums outline-none focus:ring-2 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
            style={{
              // @ts-expect-error CSS var
              "--tw-ring-color": exercise.color,
            }}
            aria-label={`Add ${exercise.label} count`}
          />
          <button
            type="submit"
            disabled={!count || loading}
            className="w-12 h-12 rounded-lg flex items-center justify-center text-on-accent disabled:opacity-40 active:scale-95 transition-transform"
            style={{ backgroundColor: exercise.color }}
            aria-label={`Add ${exercise.label}`}
          >
            <Icon name="plus" size={24} />
          </button>
        </div>
      </form>
    </li>
  );
}

function VariantC() {
  const [exType, setExType] = useState<ExerciseType>(loadLastType);
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const exercise = EXERCISE[exType];

  function updateType(t: ExerciseType) {
    setExType(t);
    saveLastType(t);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!count) return;
    setLoading(true);
    submitExercise(exType, count)
      .then(() => setCount(0))
      .finally(() => setLoading(false));
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-4 gap-2">
        {EXERCISE_ORDER.map((key) => {
          const ex = EXERCISE[key];
          const active = key === exType;
          return (
            <button
              key={key}
              type="button"
              onClick={() => updateType(key)}
              className="flex items-center justify-center py-2 rounded-lg transition-all"
              style={{
                backgroundColor: active ? ex.color : "var(--color-canvas2)",
                color: active ? "#fff" : "var(--color-canvas-text)",
                opacity: active ? 1 : 0.6,
              }}
              aria-pressed={active}
              aria-label={ex.label}
            >
              <Icon name={key as IconName} size={20} />
            </button>
          );
        })}
      </div>

      <form
        onSubmit={handleSubmit}
        className="p-6 rounded-2xl flex flex-col items-center gap-4 text-on-accent"
        style={{
          backgroundColor: exercise.color,
        }}
      >
        <div className="flex items-center gap-2 self-start">
          <Icon name={exType as IconName} size={28} />
          <span className="text-h2">{exercise.label}</span>
        </div>

        <input
          type="number"
          inputMode="numeric"
          value={count || ""}
          onChange={(e) => setCount(Number(e.target.value))}
          placeholder="0"
          min={0}
          className="w-full text-center text-[64px] font-bold tabular-nums bg-transparent outline-none placeholder:text-on-accent/40 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
          aria-label="Count"
        />

        <div className="grid grid-cols-4 gap-2 w-full">
          {[1, 5, 10, 20].map((delta) => (
            <button
              key={delta}
              type="button"
              onClick={() => setCount((c) => c + delta)}
              className="py-2 rounded-lg bg-on-accent/20 hover:bg-on-accent/30 active:scale-95 transition font-medium tabular-nums"
            >
              +{delta}
            </button>
          ))}
        </div>

        <button
          type="submit"
          disabled={!count || loading}
          className="w-full py-3 rounded-xl bg-on-accent font-semibold disabled:opacity-40 active:scale-[0.98] transition"
          style={{ color: exercise.color }}
        >
          {loading ? "Adding…" : "Add"}
        </button>
      </form>
    </div>
  );
}

export function TodayProgress() {
  const { targets, countsByType, totalsByType } = useTodayData();

  const ordered = useMemo(
    () =>
      EXERCISE_ORDER.filter(
        (type) => (countsByType[type]?.length ?? 0) > 0,
      ).map(
        (type) => [type, countsByType[type] ?? []] as [ExerciseType, number[]],
      ),
    [countsByType],
  );

  return (
    <section className="p-4 rounded-2xl border border-border">
      <h2 className="text-h2 mb-3">Today's Progress</h2>
      {ordered.length === 0 ? (
        <p className="text-muted">No exercises logged today.</p>
      ) : (
        <ul>
          {ordered.map(([type, counts]) => {
            const exercise = EXERCISE[type];
            const total = totalsByType[type] ?? 0;
            const target = targets[type]?.value;

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
                <p className="mt-1 text-sm opacity-50">{counts.join(" · ")}</p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
