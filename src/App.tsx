import { Outlet, Link, NavLink } from "react-router";
import GoogleLoginButton from "./components/login-button";
import { useAuth } from "./providers/auth";
import { Logo } from "./components/logo";
import { Icon } from "./components/icon";
import { clsx } from "clsx";

function App() {
  const { user, loading } = useAuth();

  return (
    <>
      <header className="border-b w-full mb-2">
        <div className="flex items-center justify-between p-4 max-w-150 mx-auto">
          <Link to="/" className="flex items-center text-primary-500">
            <Logo className="h-10 w-auto" />
          </Link>
          <nav
            className={clsx(
              "max-w-150 mx-auto w-full flex items-center justify-between",
              "max-sm:h-10 max-sm:fixed max-sm:bottom-0 max-sm:left-0 max-sm:right-0 max-sm:border-t max-sm:px-4 max-sm:py-2 max-sm:z-10 max-sm:bg-[Canvas]",
              "sm:w-auto "
            )}
          >
            <ul className="flex mx-auto gap-x-4 [&_a]:flex [&_a]:gap-1 [&_a]:items-center [&_a]:justify-center [&_a]:text-sm">
              <li>
                <NavLink
                  to="/"
                  className={({ isActive }) =>
                    isActive ? "text-primary-500" : ""
                  }
                >
                  <Icon name="home" />
                  Home
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/history"
                  className={({ isActive }) =>
                    isActive ? "text-primary-500" : ""
                  }
                >
                  <Icon name="notebook" />
                  History
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/settings"
                  className={({ isActive }) =>
                    isActive ? "text-primary-500" : ""
                  }
                >
                  <Icon name="gear" />
                  Settings
                </NavLink>
              </li>
            </ul>
          </nav>
          <GoogleLoginButton />
        </div>
      </header>
      <main className="max-w-150 mx-auto px-4 overflow-y-auto w-full max-sm:mb-10">
        {user ? (
          <>
            <Outlet />
          </>
        ) : loading ? (
          <div className="text-center">Loading...</div>
        ) : (
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Welcome to TrainBook</h2>
            <p>Please log in to start tracking your workouts.</p>
          </div>
        )}
      </main>
      {/* <footer className="w-full max-sm:mb-10">
        <div className="max-w-150 mx-auto p-4 text-xs text-gray-500 ">
          <p>Copyright &copy; 2025</p>
          <p>Open source, from Alexandr Rîcov with ❤️</p>
        </div>
      </footer> */}
    </>
  );
}

export default App;
