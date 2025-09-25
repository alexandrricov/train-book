import { Button } from "./action";
import { useEffect, useState, useCallback } from "react";
import { registerSW } from "virtual:pwa-register";

function usePWAUpdate() {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);

  const [doUpdate, setDoUpdate] = useState<null | ((reload?: boolean) => void)>(
    null
  );

  useEffect(() => {
    const updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        setNeedRefresh(true);
      },
      onOfflineReady() {
        setOfflineReady(true);
      },
    });
    setDoUpdate(() => updateSW);

    if ("serviceWorker" in navigator) {
      const onChange = () => {
        if (!sessionStorage.getItem("__reloaded__")) {
          sessionStorage.setItem("__reloaded__", "1");
          location.reload();
        }
      };
      navigator.serviceWorker.addEventListener("controllerchange", onChange);
      return () =>
        navigator.serviceWorker.removeEventListener(
          "controllerchange",
          onChange
        );
    }
  }, []);

  const applyUpdate = useCallback(() => {
    if (doUpdate) {
      doUpdate(true);
      setTimeout(() => location.reload(), 300);
    }
  }, [doUpdate]);

  return { needRefresh, offlineReady, applyUpdate };
}

export function PWAUpdateBanner() {
  const { needRefresh, applyUpdate } = usePWAUpdate();

  if (!needRefresh) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-4 bottom-4 px-4 py-3 rounded-xl bg-black text-white flex gap-2 items-center justify-between"
    >
      New version available.
      <Button
        type="button"
        variation="secondary"
        size="small"
        onClick={applyUpdate}
      >
        Update
      </Button>
    </div>
  );
}
