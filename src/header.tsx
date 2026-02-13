import { NavLink } from "react-router";
import { Icon } from "./components/icon";
import { clsx } from "clsx";

export function Header() {
  return (
    <header
      className={clsx(
        "max-sm:border-t sm:border-b border-border w-full bg-canvas z-10",
      )}
      style={{ gridArea: "header" }}
    >
      <div
        className={clsx(
          "flex items-center justify-between p-4 max-w-150 mx-auto",
          "max-sm:pt-2 max-sm:pb-[max(16px,env(safe-area-inset-bottom))] max-sm:pl-[max(16px,env(safe-area-inset-left))] max-sm:pr-[max(16px,env(safe-area-inset-right))]",
        )}
      >
        <nav
          className={clsx(
            "flex justify-center items-stretch w-full",
            "[&_:is(a,button)]:flex [&_:is(a,button)]:p-2 [&_:is(a,button)]:gap-1 [&_:is(a,button)]:items-center [&_:is(a,button)]:justify-center [&_:is(a,button)]:text-sm [&_:is(a,button)]:transition-colors",
            "max-sm:[&_:is(a,button)]:h-full max-sm:[&_:is(a,button)]:flex-col max-sm:[&_:is(a,button)]:min-w-15",
          )}
        >
          <ul className={clsx("max-w-150 w-full fancy-nav")}>
            <li>
              <NavLink
                to="/"
                className={({ isActive }) => (isActive ? "text-on-accent" : "")}
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
                className={({ isActive }) => (isActive ? "text-on-accent" : "")}
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
                to="/stats"
                className={({ isActive }) => (isActive ? "text-on-accent" : "")}
              >
                {({ isActive }) => (
                  <>
                    <Icon name={isActive ? "chart-bar-fill" : "chart-bar"} />{" "}
                    Stats
                  </>
                )}
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/settings"
                className={({ isActive }) => (isActive ? "text-on-accent" : "")}
              >
                {({ isActive }) => (
                  <>
                    <Icon name={isActive ? "gear-fill" : "gear"} /> Settings
                  </>
                )}
              </NavLink>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
