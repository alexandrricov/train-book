import { Button } from "./action";
import { useEffect, useState, useCallback, useRef } from "react";
import { registerSW } from "virtual:pwa-register";

function usePWAUpdate() {
  const [needRefresh, setNeedRefresh] = useState(false);
  const doUpdateRef = useRef<((reload?: boolean) => void) | null>(null);

  useEffect(() => {
    const updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        setNeedRefresh(true);
      },
    });
    doUpdateRef.current = updateSW;
  }, []);

  // Check for SW updates when app resumes from background (critical for iOS)
  // and periodically while the app is open
  useEffect(() => {
    const checkUpdate = async () => {
      const reg = await navigator.serviceWorker?.getRegistration();
      await reg?.update();
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        checkUpdate();
      }
    };

    document.addEventListener("visibilitychange", onVisible);
    const interval = setInterval(checkUpdate, 60 * 1000);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      clearInterval(interval);
    };
  }, []);

  const applyUpdate = useCallback(() => {
    doUpdateRef.current?.(true);
  }, []);

  return { needRefresh, applyUpdate };
}

export function PWAUpdateBanner() {
  const { needRefresh, applyUpdate } = usePWAUpdate();

  if (!needRefresh) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className="fixed inset-x-4 bottom-4 px-4 py-3 rounded-xl bg-grey-1000 text-grey-0 flex gap-2 items-center justify-between"
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
