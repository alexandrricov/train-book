import { Outlet } from "react-router";
import { useAuth } from "./providers/auth";
import { Header } from "./header";
import { Logo } from "./components/logo";
import { Button } from "./components/action";
import { signInWithPopup } from "firebase/auth";
import { auth, db, googleProvider } from "./firebase";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";

function App() {
  const { user, loading } = useAuth();

  const login = async () => {
    const res = await signInWithPopup(auth, googleProvider);
    const u = res.user;

    // create/update user profile (optional)
    await setDoc(
      doc(db, "users", u.uid),
      {
        uid: u.uid,
        email: u.email,
        displayName: u.displayName,
        photoURL: u.photoURL,
        lastLoginAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      },
      { merge: true }
    );
  };

  return (
    <>
      {user ? (
        <div className="h-full min-h-100dvh grid [grid-template-areas:'main''header'] sm:[grid-template-areas:'header''main'] grid-rows-[1fr_auto] sm:grid-rows-[auto_1fr]">
          <Header />
          <main className="overflow-y-auto" style={{ gridArea: "main" }}>
            <div className="max-w-150 mx-auto px-4 py-4">
              <Outlet context={{ user }} />
            </div>
          </main>
        </div>
      ) : loading ? (
        <div className="text-center">Loading...</div>
      ) : (
        <div className="text-center h-full flex flex-col justify-center items-center px-4">
          <Logo className="w-20 mx-auto text-brand mb-8" />
          <h2 className="text-2xl font-bold mb-4">Welcome to TrainBook</h2>
          <p className="mb-8">Please log in to start tracking your workouts.</p>
          <Button variation="primary" onClick={login} className="mx-auto">
            Login
          </Button>
        </div>
      )}
    </>
  );
}

export default App;
