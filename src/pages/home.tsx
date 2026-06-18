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

const STEP_BTN_CLASS =
  "w-12 h-12 rounded-full bg-canvas2 flex items-center justify-center text-base font-medium tabular-nums active:scale-95 transition-transform shrink-0";

// w-12 button = 48px, gap-2 = 8px
const SINGLE_W = 48;
const TRIO_W = 48 * 3 + 8 * 2;

/**
 * A fixed-height cluster that morphs between a single round button and a trio
 * of step buttons. Width animates while the two layouts cross-fade, so the
 * input next to it keeps a constant size and simply slides.
 */
function MorphCluster({
  pin,
  showTrio,
  single,
  trio,
}: {
  pin: "left" | "right";
  showTrio: boolean;
  single: React.ReactNode;
  trio: React.ReactNode;
}) {
  const edge = pin === "left" ? "left-0" : "right-0";
  return (
    <div
      className="relative h-12 shrink-0 transition-[width] duration-300 ease-out"
      style={{ width: showTrio ? TRIO_W : SINGLE_W }}
    >
      <div
        className={`absolute top-0 ${edge} flex items-center gap-2 transition-opacity duration-200 ${
          showTrio ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
        aria-hidden={showTrio}
      >
        {single}
      </div>
      <div
        className={`absolute top-0 ${edge} flex items-center gap-2 transition-opacity duration-200 ${
          showTrio ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden={!showTrio}
      >
        {trio}
      </div>
    </div>
  );
}

function VariantA() {
  const [exType, setExType] = useState<ExerciseType>(loadLastType);
  const [count, setCount] = useState<number>(0);
  const [mode, setMode] = useState<"add" | "subtract">("add");
  const [loading, setLoading] = useState(false);
  const exercise = EXERCISE[exType];

  function updateType(t: ExerciseType) {
    setExType(t);
    saveLastType(t);
  }

  const adjust = (delta: number) => setCount((c) => Math.max(0, c + delta));

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

      <div className="flex items-center gap-2">
        <MorphCluster
          pin="left"
          showTrio={mode === "subtract"}
          single={
            <button
              type="button"
              onClick={() => setMode("subtract")}
              className={STEP_BTN_CLASS}
              aria-label="Show subtract buttons"
            >
              <span className="text-2xl leading-none">−</span>
            </button>
          }
          trio={
            <>
              {[10, 5, 1].map((delta) => (
                <button
                  key={delta}
                  type="button"
                  onClick={() => adjust(-delta)}
                  className={STEP_BTN_CLASS}
                  aria-label={`Subtract ${delta}`}
                >
                  −{delta}
                </button>
              ))}
            </>
          }
        />

        <input
          type="number"
          inputMode="numeric"
          value={count || ""}
          onChange={(e) => setCount(Number(e.target.value))}
          placeholder="0"
          min={0}
          className="flex-1 min-w-0 h-12 px-3 rounded-2xl bg-canvas2 text-center text-[40px] font-semibold tabular-nums outline-none focus:ring-2 focus:ring-border [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
          aria-label="Count"
        />

        <MorphCluster
          pin="right"
          showTrio={mode === "add"}
          single={
            <button
              type="button"
              onClick={() => setMode("add")}
              className={STEP_BTN_CLASS}
              aria-label="Show add buttons"
            >
              <span className="text-2xl leading-none">+</span>
            </button>
          }
          trio={
            <>
              {[1, 5, 10].map((delta) => (
                <button
                  key={delta}
                  type="button"
                  onClick={() => adjust(delta)}
                  className={STEP_BTN_CLASS}
                  aria-label={`Add ${delta}`}
                >
                  +{delta}
                </button>
              ))}
            </>
          }
        />
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

const HERO_STEP_BTN_CLASS =
  "py-2 rounded-lg bg-on-accent/20 hover:bg-on-accent/30 active:scale-95 transition font-medium tabular-nums";

function VariantC() {
  const [exType, setExType] = useState<ExerciseType>(loadLastType);
  const [count, setCount] = useState<number>(0);
  const [mode, setMode] = useState<"add" | "subtract">("add");
  const [loading, setLoading] = useState(false);
  const exercise = EXERCISE[exType];

  function updateType(t: ExerciseType) {
    setExType(t);
    saveLastType(t);
  }

  const adjust = (delta: number) => setCount((c) => Math.max(0, c + delta));

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

        <div className="grid w-full">
          <div
            className={`col-start-1 row-start-1 grid grid-cols-5 gap-2 transition-opacity duration-200 ${
              mode === "add" ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
            aria-hidden={mode !== "add"}
          >
            <button
              type="button"
              onClick={() => setMode("subtract")}
              className={HERO_STEP_BTN_CLASS}
              aria-label="Show subtract buttons"
            >
              −
            </button>
            {[1, 5, 10, 20].map((delta) => (
              <button
                key={delta}
                type="button"
                onClick={() => adjust(delta)}
                className={HERO_STEP_BTN_CLASS}
                aria-label={`Add ${delta}`}
              >
                +{delta}
              </button>
            ))}
          </div>

          <div
            className={`col-start-1 row-start-1 grid grid-cols-5 gap-2 transition-opacity duration-200 ${
              mode === "subtract"
                ? "opacity-100"
                : "opacity-0 pointer-events-none"
            }`}
            aria-hidden={mode !== "subtract"}
          >
            {[20, 10, 5, 1].map((delta) => (
              <button
                key={delta}
                type="button"
                onClick={() => adjust(-delta)}
                className={HERO_STEP_BTN_CLASS}
                aria-label={`Subtract ${delta}`}
              >
                −{delta}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setMode("add")}
              className={HERO_STEP_BTN_CLASS}
              aria-label="Show add buttons"
            >
              +
            </button>
          </div>
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
