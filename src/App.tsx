import GoogleLoginButton from "./components/login-button";
import { AddSection } from "./sections/add-section";
import { useAuth } from "./providers/auth";
import { ListSection } from "./sections/list-section";
import { Logo } from "./components/logo";

function AppFirebase() {
  const { user } = useAuth();

  return (
    <>
      <header className="flex items-center justify-between p-4 border-b">
        <Logo className="h-10 w-auto" />
        <GoogleLoginButton />
      </header>
      <main className="container mx-auto px-4">
        <h1 className="text-2xl font-bold">TrainBook</h1>
        {user && (
          <>
            <AddSection />
            <ListSection />
          </>
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
