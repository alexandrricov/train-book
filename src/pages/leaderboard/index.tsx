import { useState } from "react";
import { Link } from "react-router";
import { clsx } from "clsx";
import { EXERCISE, EXERCISE_ORDER } from "../../exercises";
import { Icon, type IconName } from "../../components/icon";
import type { ExerciseType } from "../../types";
import { useLeaderboard, type LeaderboardRow } from "./use-leaderboard";
import { Avatar } from "./avatar";

type Filter = "all" | ExerciseType;

function weekValue(row: LeaderboardRow, filter: Filter): number {
  const w = row.weeklyTotal;
  if (filter === "all") {
    return EXERCISE_ORDER.reduce((sum, t) => sum + w[t], 0);
  }
  return w[filter];
}

export function Leaderboard() {
  const { rows, loading, error, myUid } = useLeaderboard();
  const [filter, setFilter] = useState<Filter>("all");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Icon name="loading" className="animate-spin text-muted" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-20 text-center text-muted">
        <p className="text-h3 mb-2 text-canvas-text">Couldn’t load leaderboard</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  const ranked = [...(rows ?? [])].sort(
    (a, b) => weekValue(b, filter) - weekValue(a, filter)
  );

  return (
    <div>
      <h1 className="text-h1 mb-1">Leaderboard</h1>
      <p className="text-xs text-muted mb-4">This week · Mon–Sun · resets Monday</p>

      <div className="flex gap-2 mb-4 overflow-x-auto -mx-4 px-4">
        <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
          All
        </FilterChip>
        {EXERCISE_ORDER.map((t) => (
          <FilterChip
            key={t}
            active={filter === t}
            onClick={() => setFilter(t)}
          >
            <Icon
              name={t as IconName}
              size={16}
              style={{ color: filter === t ? undefined : EXERCISE[t].color }}
            />
            <span className="max-sm:hidden">{EXERCISE[t].label}</span>
          </FilterChip>
        ))}
      </div>

      {ranked.length === 0 ? (
        <p className="py-20 text-center text-muted">No one has trained yet.</p>
      ) : (
        <ol className="flex flex-col gap-1.5">
          {ranked.map((row, i) => {
            const isMe = row.uid === myUid;
            return (
              <li key={row.uid}>
                <Link
                  to={`/u/${row.uid}`}
                  className={clsx(
                    "flex items-center gap-3 p-2.5 rounded-xl transition-colors",
                    isMe
                      ? "bg-brand/10 ring-1 ring-brand/30"
                      : "hover:bg-canvas2"
                  )}
                >
                  <Rank rank={i + 1} />
                  <Avatar
                    name={row.displayName}
                    photoURL={row.photoURL}
                    size={36}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {row.displayName}
                      {isMe && <span className="text-brand"> · You</span>}
                    </p>
                    <p className="text-xs text-muted">
                      🔥 {row.currentStreak}d streak
                    </p>
                  </div>
                  <span
                    className="text-h3 tabular-nums"
                    style={{
                      color: filter === "all" ? undefined : EXERCISE[filter].color,
                    }}
                  >
                    {weekValue(row, filter).toLocaleString()}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

function Rank({ rank }: { rank: number }) {
  const medal =
    rank === 1
      ? "#FFC53D"
      : rank === 2
        ? "#B8C0CC"
        : rank === 3
          ? "#E08A4B"
          : null;

  if (medal) {
    return (
      <span
        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
        style={{ backgroundColor: medal }}
      >
        {rank}
      </span>
    );
  }
  return (
    <span className="w-6 text-center text-sm tabular-nums text-muted shrink-0">
      {rank}
    </span>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm whitespace-nowrap border transition-colors",
        active
          ? "bg-brand text-on-accent border-brand"
          : "border-border hover:bg-canvas2"
      )}
    >
      {children}
    </button>
  );
}
