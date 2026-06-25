import { useState } from "react";
import { Link } from "react-router";
import { clsx } from "clsx";
import { EXERCISE, EXERCISE_ORDER } from "../../exercises";
import { Icon, type IconName } from "../../components/icon";
import type { ExerciseType } from "../../types";
import { useLeaderboard, type LeaderboardRow } from "./use-leaderboard";
import { Avatar } from "./avatar";

type Board = "week" | "streak" | "alltime";
type Filter = "all" | ExerciseType;

const BOARDS: { key: Board; label: string; subtitle: string }[] = [
  { key: "week", label: "This week", subtitle: "Reps this week · Mon–Sun · resets Monday" },
  { key: "streak", label: "Streak", subtitle: "Current training streak" },
  { key: "alltime", label: "All-time", subtitle: "Total reps logged, all time" },
];

function boardValue(row: LeaderboardRow, board: Board, filter: Filter): number {
  switch (board) {
    case "streak":
      return row.currentStreak;
    case "alltime":
      return row.grandTotal;
    case "week":
      return filter === "all"
        ? EXERCISE_ORDER.reduce((sum, t) => sum + row.weeklyTotal[t], 0)
        : row.weeklyTotal[filter];
  }
}

export function Leaderboard() {
  const { rows, loading, error, myUid } = useLeaderboard();
  const [board, setBoard] = useState<Board>("week");
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
    (a, b) => boardValue(b, board, filter) - boardValue(a, board, filter)
  );
  const iAmListed = ranked.some((r) => r.uid === myUid);
  const subtitle = BOARDS.find((b) => b.key === board)!.subtitle;

  return (
    <div>
      <h1 className="text-h1 mb-3">Leaderboard</h1>

      <div className="flex gap-1 p-1 rounded-full bg-canvas2 mb-3">
        {BOARDS.map((b) => (
          <button
            key={b.key}
            type="button"
            onClick={() => setBoard(b.key)}
            aria-pressed={board === b.key}
            className={clsx(
              "flex-1 py-1.5 rounded-full text-sm font-medium transition-colors",
              board === b.key
                ? "bg-brand text-on-accent"
                : "text-muted hover:text-canvas-text"
            )}
          >
            {b.label}
          </button>
        ))}
      </div>

      <p className="text-xs text-muted mb-4">{subtitle}</p>

      {board === "week" && (
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
      )}

      {ranked.length === 0 ? (
        <EmptyState iAmListed={iAmListed} />
      ) : (
        <>
          <ol className="flex flex-col gap-1.5">
            {ranked.map((row, i) => {
              const isMe = row.uid === myUid;
              const value = boardValue(row, board, filter);
              const valueColor =
                board === "week" && filter !== "all"
                  ? EXERCISE[filter].color
                  : undefined;
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
                        {board === "streak"
                          ? `best ${row.longestStreak}d`
                          : `🔥 ${row.currentStreak}d streak`}
                      </p>
                    </div>
                    <span
                      className="text-h3 tabular-nums"
                      style={{ color: valueColor }}
                    >
                      {board === "streak"
                        ? `${value}d`
                        : value.toLocaleString()}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>

          {!iAmListed && <JoinHint />}
        </>
      )}
    </div>
  );
}

function EmptyState({ iAmListed }: { iAmListed: boolean }) {
  return (
    <div className="py-16 text-center text-muted">
      <p className="mb-2">No one’s on the leaderboard yet.</p>
      {!iAmListed && (
        <p className="text-sm">
          Turn on{" "}
          <Link to="/settings" className="text-brand">
            Show me on the leaderboard
          </Link>{" "}
          in Settings to be the first.
        </p>
      )}
    </div>
  );
}

function JoinHint() {
  return (
    <p className="text-xs text-muted text-center mt-4">
      Not seeing yourself? Turn on{" "}
      <Link to="/settings" className="text-brand">
        Public profile
      </Link>{" "}
      in Settings.
    </p>
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
