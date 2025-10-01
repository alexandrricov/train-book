import { Fragment, useEffect, useState } from "react";
import { useOutletContext } from "react-router";
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

      <Targets />
      <AddTarget />
      <section>
        <h2 className="text-h2 mb-4">Import/Export data</h2>
        <div className="flex items-center gap-4">
          <Button variation="primary" onClick={() => exportMyItemsToJSON()}>
            Export Items
          </Button>
          <label className="cursor-pointer bg-canvas text-gray-700 px-4 py-2 rounded-xl hover:bg-grey-100 dark:hover:bg-grey-600">
            Import Items
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
