import { Link, NavLink } from "react-router";
import { GoogleLoginButton } from "./components/login-button";
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
import { Logo } from "./components/logo";

export function Header() {
  const ref = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [exType, setExType] = useState<ExerciseType>(
    EXERCISE_ORDER[0] || "pushup"
  );
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    const html = document.documentElement;
    if (open) {
      const prev = html.style.overflow;
      html.style.overflow = "hidden";
      return () => {
        html.style.overflow = prev;
      };
    }
  }, [open]);

  return (
    <header className="border-b border-border w-full mb-2 sticky top-0 bg-canvas z-10">
      <div className="flex items-center justify-between p-4 max-w-150 mx-auto">
        <Link to="/" className="flex items-center text-brand">
          <Logo className="h-10 w-auto" />
        </Link>
        <nav
          className={clsx(
            "w-full flex justify-center items-stretch",
            "max-sm:fixed max-sm:bottom-0 max-sm:left-0 max-sm:right-0 max-sm:shadow-[0_-1px_0_0_rgba(0,0,0,1)] max-sm:py-2 max-sm:z-10 max-sm:bg-canvas",
            "sm:w-auto"
          )}
        >
          <ul
            className={clsx(
              "flex gap-x-4 max-w-150",
              "[&_:is(a,button)]:flex [&_:is(a,button)]:gap-1 [&_:is(a,button)]:items-center [&_:is(a,button)]:justify-center [&_:is(a,button)]:text-sm [&_:is(a,button)]:hover:text-brand",
              "max-sm:[&_:is(a,button)]:h-full max-sm:[&_:is(a,button)]:flex-col"
            )}
          >
            <li>
              <NavLink
                to="/"
                className={({ isActive }) => (isActive ? "text-brand" : "")}
              >
                <Icon name="home" />
                Home
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/history"
                className={({ isActive }) => (isActive ? "text-brand" : "")}
              >
                <Icon name="notebook" />
                History
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/settings"
                className={({ isActive }) => (isActive ? "text-brand" : "")}
              >
                <Icon name="gear" />
                Settings
              </NavLink>
            </li>
            <li>
              <button type="button" onClick={() => setOpen(!open)}>
                <Icon name="plus" />
                Add
              </button>
            </li>
          </ul>
        </nav>
        <GoogleLoginButton />
      </div>

      <dialog
        ref={ref}
        // onClick={onClickBackdrop}
        className={clsx(
          "mx-auto mt-auto p-4 rounded-t-2xl shadow-sm border border-border w-full max-w-md bg-canvas",
          "md:mb-auto md:rounded-b-2xl"
        )}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-h2">Add set</h2>
          <button type="button" onClick={() => setOpen(false)}>
            <Icon name="close" />
          </button>
        </div>
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
                ref.current?.close();
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
      </dialog>
    </header>
  );
}
