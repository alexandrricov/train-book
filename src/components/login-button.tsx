import { signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider, db } from "../firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../providers/auth";

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
  console.log("user in login button", user);
  return (
    <div className="flex items-center gap-2">
      {user ? (
        <>
          {/* <span>{user?.email}</span> */}
          {user?.photoURL && (
            <img
              src={user.photoURL}
              alt={user.displayName ?? "User Avatar"}
              className="size-10 rounded-full"
            />
          )}
          <button
            onClick={logout}
            className="rounded-xl px-4 py-2 border hover:bg-gray-50"
          >
            Logout
          </button>
        </>
      ) : (
        <button
          onClick={login}
          className="rounded-xl px-4 py-2 bg-black text-white hover:opacity-90"
        >
          Login
        </button>
      )}
    </div>
  );
}
