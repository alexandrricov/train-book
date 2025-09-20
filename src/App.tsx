import GoogleLoginButton from "./components/login-button";
import { AddSection } from "./sections/add-section";
import { useAuth } from "./providers/auth";
import { ListSection } from "./sections/list-section";
import { Logo } from "./components/logo";

function AppFirebase() {
  const { user, loading } = useAuth();

  return (
    <>
      <header className="flex items-center justify-between p-4 border-b mb-6">
        <Logo className="h-10 w-auto" />
        <GoogleLoginButton />
      </header>
      <main className="container mx-auto px-4">
        {user ? (
          <>
            <AddSection />
            <ListSection />
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
      <footer className="w-full mx-auto p-4 text-xs text-gray-500">
        <p>Copyright &copy; 2025</p>
        <p>Open source, from Alexandr Rîcov with ❤️</p>
      </footer>
    </>
  );
}

export default AppFirebase;

// import { useState } from "react";
// import reactLogo from "./assets/react.svg";
// import viteLogo from "/vite.svg";

// function App() {
//   const [count, setCount] = useState(0);

//   return (
//     <>
//       <div>
//         <a href="https://vite.dev" target="_blank">
//           <img src={viteLogo} className="logo" alt="Vite logo" />
//         </a>
//         <a href="https://react.dev" target="_blank">
//           <img src={reactLogo} className="logo react" alt="React logo" />
//         </a>
//       </div>
//       <h1>Vite + React</h1>
//       <div className="card">
//         <button onClick={() => setCount((count) => count + 1)}>
//           count is {count}
//         </button>
//         <p>
//           Edit <code>src/App.tsx</code> and save to test HMR
//         </p>
//       </div>
//       <p className="read-the-docs">
//         Click on the Vite and React logos to learn more
//       </p>
//     </>
//   );
// }

// export default App;
