import { useEffect, useState } from "react";
import {
  subscribeMyProfile,
  setMyLeaderboardVisibility,
} from "../../firebase-db";

/**
 * Read + toggle whether the current user appears on the leaderboard.
 * `ready` becomes true once the stored value has loaded — use it to avoid
 * animating the toggle when the initial server value settles.
 */
export function useLeaderboardVisibility(): [
  boolean,
  (next: boolean) => void,
  boolean,
] {
  const [isPublic, setIsPublic] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unsub = subscribeMyProfile((p) => {
      setIsPublic(p?.leaderboardPublic ?? false);
      setReady(true);
    });
    return () => unsub();
  }, []);

  const update = (next: boolean) => {
    setIsPublic(next); // optimistic; the subscription confirms
    setMyLeaderboardVisibility(next).catch(() => setIsPublic(!next));
  };

  return [isPublic, update, ready];
}
