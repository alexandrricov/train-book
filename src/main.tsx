import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes, Navigate } from "react-router";
import "./index.css";
import App from "./App";
import { AuthProvider } from "./providers/auth";

import { Home } from "./pages/home";
import { History } from "./pages/history";
import { Settings } from "./pages/settings";
import { PWAUpdateBanner } from "./components/pwa-update-banner";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route path="/" element={<App />}>
            <Route index element={<Home />} />
            <Route path="history" element={<History />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <PWAUpdateBanner />
    </AuthProvider>
  </StrictMode>
);
