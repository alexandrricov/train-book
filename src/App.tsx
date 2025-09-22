import GoogleLoginButton from "./components/login-button";
import { useAuth } from "./providers/auth";
import { Logo } from "./components/logo";
import { NavLink, Outlet } from "react-router";

function App() {
  const { user, loading } = useAuth();

  return (
    <>
      <header className="flex items-center justify-between p-4 border-b mb-6">
        <Logo className="h-10 w-auto" />
        <nav className="max-md:h-10 max-md:fixed max-md:bottom-0 max-md:left-0 max-md:right-0 max-md:border-t max-md:px-4 max-md:py-2 flex items-center justify-between w-full md:w-auto max-md:z-10 max-md:bg-white">
          <ul className="flex space-x-4">
            <li>
              <NavLink to="/">Home</NavLink>
            </li>
            <li>
              <NavLink to="/history">History</NavLink>
            </li>
            <li>
              <NavLink to="/settings">Settings</NavLink>
            </li>
          </ul>
        </nav>
        <GoogleLoginButton />
      </header>
      <main className="container mx-auto px-4">
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
      <footer className="w-full mx-auto p-4 text-xs text-gray-500 max-md:mb-10">
        <p>Copyright &copy; 2025</p>
        <p>Open source, from Alexandr Rîcov with ❤️</p>
      </footer>
    </>
  );
}

export default App;
