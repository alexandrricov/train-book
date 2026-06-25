import { Link, useParams } from "react-router";
import { EXERCISE, EXERCISE_ORDER } from "../../exercises";
import { Icon, type IconName } from "../../components/icon";
import { useLeaderboard } from "./use-leaderboard";
import { Avatar } from "./avatar";

function formatSince(dateStr: string): string {
  if (!dateStr) return "";
  return new Date(dateStr + "T00:00:00").toLocaleDateString(undefined, {
    month: "short",
    year: "numeric",
  });
}

export function Profile() {
  const { uid } = useParams();
  const { rows, loading, error, myUid } = useLeaderboard();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Icon name="loading" className="animate-spin text-muted" />
      </div>
    );
  }

  const row = rows?.find((r) => r.uid === uid);

  if (error || !row) {
    return (
      <div className="py-20 text-center text-muted">
        <p className="text-h3 mb-2 text-canvas-text">Profile not found</p>
        <Link to="/leaderboard" className="text-brand text-sm">
          Back to leaderboard
        </Link>
      </div>
    );
  }

  const isMe = row.uid === myUid;
  const weekTotal = EXERCISE_ORDER.reduce(
    (sum, t) => sum + row.weeklyTotal[t],
    0
  );
  const maxWeek = Math.max(...EXERCISE_ORDER.map((t) => row.weeklyTotal[t]), 1);

  return (
    <div>
      <Link
        to="/leaderboard"
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-canvas-text mb-4"
      >
        <Icon name="chevron-up" size={16} className="-rotate-90" /> Leaderboard
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <Avatar name={row.displayName} photoURL={row.photoURL} size={64} />
        <div className="min-w-0">
          <h1 className="text-h2 truncate">
            {row.displayName}
            {isMe && <span className="text-brand text-sm"> · You</span>}
          </h1>
          {row.firstDate && (
            <p className="text-xs text-muted mt-1">
              Training since {formatSince(row.firstDate)}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatCard label="Current streak" value={`${row.currentStreak} d`} />
        <StatCard label="Longest streak" value={`${row.longestStreak} d`} />
      </div>

      <section className="section">
        <h2 className="text-h3 mb-1">This week</h2>
        <p className="text-xs text-muted mb-3">
          Reps logged Mon–Sun · {weekTotal.toLocaleString()} total
        </p>
        {EXERCISE_ORDER.map((t) => {
          const val = row.weeklyTotal[t];
          return (
            <div key={t} className="flex items-center gap-2 not-last:mb-2">
              <Icon
                name={t as IconName}
                size={16}
                style={{ color: EXERCISE[t].color }}
              />
              <span className="text-sm w-16 shrink-0">{EXERCISE[t].label}</span>
              <div className="flex-1 h-2 rounded-full bg-border/30 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(val / maxWeek) * 100}%`,
                    backgroundColor: EXERCISE[t].color,
                  }}
                />
              </div>
              <span className="text-sm tabular-nums w-12 text-right">
                {val.toLocaleString()}
              </span>
            </div>
          );
        })}
      </section>

      <section className="section">
        <h2 className="text-h3 mb-3">Exercise balance</h2>
        <div className="h-4 rounded-full overflow-hidden flex mb-2">
          {EXERCISE_ORDER.map((t) => {
            const pct = row.exerciseBalance[t];
            if (pct === 0) return null;
            return (
              <div
                key={t}
                style={{ width: `${pct}%`, backgroundColor: EXERCISE[t].color }}
              />
            );
          })}
        </div>
        <div className="grid grid-cols-2 gap-1">
          {EXERCISE_ORDER.map((t) => (
            <div key={t} className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full inline-block"
                style={{ backgroundColor: EXERCISE[t].color }}
              />
              <span className="text-xs">
                {EXERCISE[t].label}{" "}
                <span className="tabular-nums font-medium">
                  {row.exerciseBalance[t]}%
                </span>
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <h2 className="text-h3 mb-3">Best single set</h2>
        <div className="grid grid-cols-2 gap-3">
          {EXERCISE_ORDER.map((t) => (
            <div
              key={t}
              className="p-3 rounded-xl bg-canvas2 flex items-center gap-2"
            >
              <Icon
                name={t as IconName}
                size={20}
                style={{ color: EXERCISE[t].color }}
              />
              <div>
                <p className="text-xs text-muted">{EXERCISE[t].label}</p>
                <p className="text-h3 tabular-nums">
                  {row.bestSet[t] || "—"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-xl bg-canvas2">
      <p className="text-xs text-muted mb-1">{label}</p>
      <p className="text-h2 tabular-nums">{value}</p>
    </div>
  );
}
