import { useEffect, useState } from "react";
import { useAuth } from "../../providers/auth";
import { subscribeLeaderboard, type LeaderboardDoc } from "../../firebase-db";
import { mondayOf, ZERO_TOTALS } from "./week";

export type LeaderboardRow = LeaderboardDoc & { uid: string };

type State = {
  rows: LeaderboardRow[] | null;
  error: string | null;
};

export function useLeaderboard() {
  const { user } = useAuth();
  const [state, setState] = useState<State>({ rows: null, error: null });

  useEffect(() => {
    const unsub = subscribeLeaderboard(
      (rows) => {
        // A slice from a previous week shouldn't show last week's reps as "this week".
        const currentWeekKey = mondayOf();
        const normalized = rows.map((r) =>
          r.weekKey === currentWeekKey
            ? r
            : { ...r, weeklyTotal: ZERO_TOTALS }
        );
        setState({ rows: normalized, error: null });
      },
      (e) => setState({ rows: null, error: e.message })
    );
    return () => unsub();
  }, []);

  return {
    rows: state.rows,
    error: state.error,
    loading: state.rows === null && state.error === null,
    myUid: user?.uid ?? null,
  };
}
