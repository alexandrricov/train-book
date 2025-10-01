import { Outlet } from "react-router";
import { useAuth } from "./providers/auth";
import { Header } from "./header";

function App() {
  const { user, loading } = useAuth();

  return (
    <>
      <Header />
      <main className="overflow-y-auto" style={{ gridArea: "main" }}>
        <div className="max-w-150 mx-auto px-4 py-4">
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
        </div>
      </main>
    </>
  );
}

export default App;
