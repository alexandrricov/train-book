import { useEffect } from "react";
import { useAuth } from "../../providers/auth";
import {
  subscribeItems,
  subscribeMyProfile,
  publishMyLeaderboardEntry,
  unpublishMyLeaderboardEntry,
} from "../../firebase-db";
import type { SetRowDB } from "../../types";
import { computeAllStats } from "../stats/compute-stats";
import { dense, mondayOf } from "./week";

/**
 * Keeps the current user's public leaderboard slice (/leaderboard/{uid}) in
 * sync with their private logs — but only while they've opted in. Mounted once
 * while signed in. Raw items never leave the owner; only this slice is published.
 */
export function usePublishMyEntry() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    let isPublic = false;
    let items: SetRowDB[] | null = null;

    const sync = () => {
      if (items === null) return; // wait until logs are known
      if (!isPublic) {
        unpublishMyLeaderboardEntry().catch(() => {});
        return;
      }
      const stats = computeAllStats(items, []);
      if (stats.grandTotal === 0) return; // nothing worth publishing yet

      publishMyLeaderboardEntry({
        displayName: user.displayName ?? "Anonymous",
        photoURL: user.photoURL ?? null,
        firstDate: stats.firstDate,
        currentStreak: stats.currentStreak,
        longestStreak: stats.longestStreak.length,
        weekKey: mondayOf(),
        weeklyTotal: dense(stats.weeklyTotal),
        exerciseBalance: dense(stats.exerciseBalance),
        bestSet: {
          pushup: stats.bestSet.pushup?.count ?? 0,
          pullup: stats.bestSet.pullup?.count ?? 0,
          squat: stats.bestSet.squat?.count ?? 0,
          abs: stats.bestSet.abs?.count ?? 0,
        },
        grandTotal: stats.grandTotal,
      }).catch(() => {
        // Non-critical: leaderboard stays stale until the next successful write.
      });
    };

    const unsubPref = subscribeMyProfile((p) => {
      isPublic = p?.leaderboardPublic ?? false;
      sync();
    });
    const unsubItems = subscribeItems((next) => {
      items = next;
      sync();
    });

    return () => {
      unsubPref();
      unsubItems();
    };
  }, [user]);
}
