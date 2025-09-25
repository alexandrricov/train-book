import { signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider, db } from "../firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../providers/auth";
import { Button } from "./action";
import { Dropdown } from "./dropdown";

export default function GoogleLoginButton() {
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

  const logout = async () => signOut(auth);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="flex items-center gap-2">
      {user ? (
        <>
          <Dropdown
            target={(ref, toggle) => (
              <button type="button" ref={ref} onClick={toggle}>
                <img
                  src={user.photoURL ?? ""}
                  alt={user.displayName ?? "User Avatar"}
                  className="size-10 rounded-full"
                />
              </button>
            )}
          >
            <div className="mb-2 text-center font-bold">{user.displayName}</div>
            <div className="mb-2">{user.email}</div>
            <Button variation="secondary" onClick={logout} className="w-full">
              Logout
            </Button>
          </Dropdown>
        </>
      ) : (
        <Button variation="primary" onClick={login}>
          Login
        </Button>
      )}
    </div>
  );
}
