import { Fragment, useEffect, useState } from "react";
import { useOutletContext } from "react-router";
import { clsx } from "clsx";
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
import { auth } from "../firebase";
import { signOut, type User } from "firebase/auth";
import { ADD_VARIANT_OPTIONS, useAddVariant } from "./home-variant";
import { useLeaderboardVisibility } from "./leaderboard/use-visibility";

export function Settings() {
  const { user } = useOutletContext<{ user: User }>();

  return (
    <>
      <h1 className="text-h1 mb-4 sr-only">Settings</h1>

      <section className="section flex gap-2 items-center">
        <img
          src={user.photoURL ?? ""}
          alt={user.displayName ?? "User Avatar"}
          className="size-10 rounded-full"
        />
        <div>
          <div className="font-bold">{user.displayName}</div>
          <div>{user.email}</div>
        </div>
        <Button
          variation="secondary"
          onClick={() => signOut(auth)}
          className="ml-auto"
        >
          Logout
        </Button>
      </section>

      <PublicProfile />
      <Targets />
      <AddTarget />
      <AddFormVariant />
      <section>
        <h2 className="text-h2 mb-4">Import/Export data</h2>
        <div className="flex items-center gap-4">
          <Button variation="primary" onClick={() => exportMyItemsToJSON()}>
            Export Data
          </Button>
          <label className="cursor-pointer bg-canvas text-muted px-4 py-2 rounded-xl hover:bg-canvas-text/10">
            Import Data
            <input
              type="file"
              name="import"
              className="sr-only"
              accept="application/json"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file && window.confirm("Import items from JSON?")) {
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

function PublicProfile() {
  const [isPublic, setPublic, ready] = useLeaderboardVisibility();
  // Only animate the knob on real toggles, not when the stored value loads.
  const [animate, setAnimate] = useState(false);
  useEffect(() => {
    if (!ready) return;
    const id = requestAnimationFrame(() => setAnimate(true));
    return () => cancelAnimationFrame(id);
  }, [ready]);

  return (
    <section className="section">
      <h2 className="text-h2 mb-1">Public profile</h2>
      <p className="text-sm text-muted mb-4">
        When on, your name, current streak and weekly volume appear on the
        leaderboard, and other members can open your profile. Your detailed logs
        and targets always stay private.
      </p>
      <button
        type="button"
        role="switch"
        aria-checked={isPublic}
        onClick={() => setPublic(!isPublic)}
        className="flex items-center justify-between w-full cursor-pointer"
      >
        <span className="font-medium">Show me on the leaderboard</span>
        <span
          aria-hidden="true"
          className="relative w-11 h-6 rounded-full bg-border shrink-0"
        >
          <span
            className={clsx(
              "absolute top-0.5 left-0.5 size-5 rounded-full shadow-sm",
              animate && "transition-all",
              isPublic ? "bg-brand translate-x-5" : "bg-muted"
            )}
          />
        </span>
      </button>
    </section>
  );
}

function Targets() {
  const [items, setItems] = useState<TargetsAsOf>({});

  useEffect(() => {
    const unsubItems = subscribeTargets(toDateString(), setItems);

    return () => {
      unsubItems();
    };
  }, []);

  return (
    <section className="mb-6">
      <h2 className="mb-4 text-h2">Targets</h2>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-2 [&_dd]:text-right">
        {EXERCISE_ORDER.map((ex) => (
          <Fragment key={ex}>
            <dt>{EXERCISE[ex].label}</dt>
            <dd>{items[ex]?.value ?? "not set"}</dd>
          </Fragment>
        ))}
      </dl>
    </section>
  );
}

function AddFormVariant() {
  const [variant, setVariant] = useAddVariant();

  return (
    <section className="mb-6">
      <h2 className="text-h2 mb-4">Add form style</h2>
      <ul role="radiogroup" aria-label="Add form style" className="grid gap-2">
        {ADD_VARIANT_OPTIONS.map((option) => {
          const selected = option.value === variant;
          return (
            <li key={option.value}>
              <button
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setVariant(option.value)}
                className="w-full text-left p-3 rounded-xl border transition-colors cursor-pointer"
                style={{
                  borderColor: selected
                    ? "var(--color-brand)"
                    : "var(--color-border)",
                  backgroundColor: selected
                    ? "color-mix(in oklab, var(--color-brand), transparent 88%)"
                    : "transparent",
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{option.title}</span>
                  <span
                    aria-hidden="true"
                    className="size-4 rounded-full border flex items-center justify-center"
                    style={{
                      borderColor: selected
                        ? "var(--color-brand)"
                        : "var(--color-border)",
                    }}
                  >
                    {selected && (
                      <span className="size-2 rounded-full bg-brand" />
                    )}
                  </span>
                </div>
                <p className="text-sm text-muted mt-1">{option.description}</p>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function AddTarget() {
  const [exType, setExType] = useState<ExerciseType>(
    EXERCISE_ORDER[0] || "pushup"
  );
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  return (
    <section className="mb-6">
      <h2 className="text-h2 mb-4">Add Target</h2>

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
          inputMode="numeric"
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
          Add
        </Button>
      </form>
    </section>
  );
}
