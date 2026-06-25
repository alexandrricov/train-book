import { useEffect, useState } from "react";
import {
  subscribeMyProfile,
  setMyLeaderboardVisibility,
} from "../../firebase-db";

/** Read + toggle whether the current user appears on the leaderboard. */
export function useLeaderboardVisibility(): [boolean, (next: boolean) => void] {
  const [isPublic, setIsPublic] = useState(false);

  useEffect(() => {
    const unsub = subscribeMyProfile((p) => {
      setIsPublic(p?.leaderboardPublic ?? false);
    });
    return () => unsub();
  }, []);

  const update = (next: boolean) => {
    setIsPublic(next); // optimistic; the subscription confirms
    setMyLeaderboardVisibility(next).catch(() => setIsPublic(!next));
  };

  return [isPublic, update];
}
