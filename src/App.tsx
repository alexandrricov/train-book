import { Outlet } from "react-router";
import { useAuth } from "./providers/auth";
import { Header } from "./header";

function App() {
  const { user, loading } = useAuth();

  return (
    <>
      <Header />
      <main className="max-w-150 mx-auto px-4 w-full max-sm:mb-20">
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
