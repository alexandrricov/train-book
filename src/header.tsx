import { NavLink } from "react-router";
import { Icon } from "./components/icon";
import { clsx } from "clsx";
import { useEffect, useRef, useState } from "react";
import { EXERCISE, EXERCISE_ORDER } from "./exercises";
import type { ExerciseType, SetRow } from "./types";
import { createItemForCurrentUser } from "./firebase-db";
import { Select } from "./components/select";
import { Input } from "./components/input";
import { Button } from "./components/action";
import { toDateString } from "./utils/date";
// import { Logo } from "./components/logo";

export function Header() {
  const ref = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleClose = () => setOpen(false);
    el.addEventListener("close", handleClose);
    el.addEventListener("cancel", handleClose);

    if (open && !el.open) {
      const countInput = (
        el.querySelector("form") as HTMLFormElement | undefined
      )?.elements.namedItem("count") as HTMLInputElement | undefined;

      try {
        el.showModal();
        countInput?.focus();
      } catch {
        if (!el.open) {
          el.showModal();
          countInput?.focus();
        }
      }
    }

    if (!open && el.open) {
      el.close();
    }

    return () => {
      el.removeEventListener("close", handleClose);
      el.removeEventListener("cancel", handleClose);
    };
  }, [open]);

  // const onClickBackdrop: React.MouseEventHandler<HTMLDialogElement> = (e) => {
  //   const el = ref.current;
  //   if (el && e.target === el) {
  //     el.close();
  //   }
  // };

  return (
    <header
      className={clsx(
        "max-sm:border-t sm:border-b border-border w-full bg-canvas z-10"
      )}
      style={{ gridArea: "header" }}
    >
      <div
        className={clsx(
          "flex items-center justify-between p-4 max-w-150 mx-auto",
          "max-sm:pt-2 max-sm:pb-[max(16px,env(safe-area-inset-bottom))] max-sm:pl-[max(16px,env(safe-area-inset-left))] max-sm:pr-[max(16px,env(safe-area-inset-right))]"
        )}
      >
        <nav className="flex justify-center items-stretch w-full">
          <ul
            className={clsx(
              "flex gap-x-4 max-w-150 w-full",
              "[&_:is(a,button)]:flex [&_:is(a,button)]:gap-1 [&_:is(a,button)]:items-center [&_:is(a,button)]:justify-center [&_:is(a,button)]:text-sm [&_:is(a,button)]:hover:text-brand",
              "max-sm:[&_:is(a,button)]:h-full max-sm:[&_:is(a,button)]:flex-col max-sm:[&_:is(a,button)]:min-w-15"
            )}
          >
            <li>
              <NavLink
                to="/"
                className={({ isActive }) => (isActive ? "text-brand" : "")}
              >
                {({ isActive }) => (
                  <>
                    <Icon name={isActive ? "house-fill" : "house"} /> Home
                  </>
                )}
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/history"
                className={({ isActive }) => (isActive ? "text-brand" : "")}
              >
                {({ isActive }) => (
                  <>
                    <Icon name={isActive ? "clipboard-fill" : "clipboard"} />{" "}
                    History
                  </>
                )}
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/settings"
                className={({ isActive }) => (isActive ? "text-brand" : "")}
              >
                {({ isActive }) => (
                  <>
                    <Icon name={isActive ? "gear-fill" : "gear"} /> Settings
                  </>
                )}
              </NavLink>
            </li>
            <li className="ml-auto">
              <button type="button" onClick={() => setOpen(!open)}>
                <Icon name="plus" />
                Add
              </button>
            </li>
          </ul>
        </nav>
      </div>

      <dialog
        ref={ref}
        // onClick={onClickBackdrop}
        className={clsx(
          "mx-auto mt-auto p-4 rounded-t-2xl shadow-sm border border-border w-full max-w-md bg-canvas",
          "md:mb-auto md:rounded-b-2xl",
          "max-md:pb-8"
        )}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-h2">Add set</h2>
          <button type="button" onClick={() => setOpen(false)}>
            <Icon name="close" />
          </button>
        </div>
        <AddForm completeHandler={() => ref.current?.close()} />
      </dialog>
    </header>
  );
}

function AddForm({ completeHandler }: { completeHandler: () => void }) {
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
            // setExType(DEFAULT_EXERCISES[0] || "pushup");
            // setDate(toLocalDateString());
            completeHandler();
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
