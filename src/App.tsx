import { Outlet } from "react-router";
import { useAuth } from "./providers/auth";
import { Header } from "./header";
import { Logo } from "./components/logo";

function App() {
  const { user, loading } = useAuth();

  return (
    <>
      <Header />
      <main className="overflow-y-auto" style={{ gridArea: "main" }}>
        <div className="max-w-150 mx-auto px-4 py-4">
          {user ? (
            <Outlet context={{ user }} />
          ) : loading ? (
            <div className="text-center">Loading...</div>
          ) : (
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Welcome to TrainBook</h2>
              <p className="mb-4">
                Please log in to start tracking your workouts.
              </p>
              <Logo className="w-30 mx-auto text-brand" />
            </div>
          )}
        </div>
      </main>
    </>
  );
}

export default App;
