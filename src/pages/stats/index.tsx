import { EXERCISE, EXERCISE_ORDER } from "../../exercises";
import { Icon, type IconName } from "../../components/icon";
import type { ExerciseType } from "../../types";
import { useStats } from "./use-stats";
import type { ComputedStats, ExerciseRate, ExerciseRecord } from "./types";
import { ChartSection } from "./chart-section";

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

function formatDateRange(start: string, end: string): string {
  if (!start || !end) return "";
  return `${formatDate(start)} — ${formatDate(end)}`;
}

export function Stats() {
  const { stats, items, targetsAsOf, loading } = useStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Icon name="loading" className="animate-spin text-muted" />
      </div>
    );
  }

  if (!stats || stats.totalDays === 0) {
    return (
      <div className="py-20 text-center text-muted">
        <p className="text-h2 mb-2">No data yet</p>
        <p>Log some exercises to see your stats.</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-h1 mb-4">Stats</h1>
      <ChartSection allItems={items ?? []} targets={targetsAsOf} />
      <StreakSection stats={stats} />
      <VolumeSection stats={stats} />
      <IntensitySection stats={stats} />
      <PatternsSection stats={stats} />
      <RecordsSection stats={stats} />
    </div>
  );
}

function StatCard({
  label,
  value,
  subtitle,
}: {
  label: string;
  value: string | number;
  subtitle?: string;
}) {
  return (
    <div className="p-3 rounded-xl bg-canvas2">
      <p className="text-xs text-muted mb-1">{label}</p>
      <p className="text-h2 tabular-nums">{value}</p>
      {subtitle && <p className="text-xs text-muted mt-1">{subtitle}</p>}
    </div>
  );
}

function StreakSection({ stats }: { stats: ComputedStats }) {
  const { currentStreak, longestStreak, weeklyConsistency, targetHitRate } =
    stats;

  return (
    <section className="section">
      <h2 className="text-h2 mb-3">Streak & Consistency</h2>
      <p className="text-xs text-muted mb-3">
        How regularly you train
      </p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <StatCard
          label="Current streak"
          value={`${currentStreak} d`}
          subtitle="Consecutive days with training"
        />
        <StatCard
          label="Longest streak"
          value={`${longestStreak.length} d`}
          subtitle={
            longestStreak.length > 0
              ? formatDateRange(longestStreak.startDate, longestStreak.endDate)
              : undefined
          }
        />
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-sm">This week</p>
          <p className="text-sm tabular-nums font-medium">
            {weeklyConsistency.trained} / {weeklyConsistency.total} days
          </p>
        </div>
        <div className="h-2 rounded-full overflow-hidden bg-border/30">
          <div
            className="h-full rounded-full bg-brand transition-all"
            style={{
              width: `${(weeklyConsistency.trained / weeklyConsistency.total) * 100}%`,
            }}
          />
        </div>
        <p className="text-xs text-muted mt-1">
          Days trained in the current Mon–Sun week
        </p>
      </div>

      {Object.keys(targetHitRate).length > 0 && (
        <div>
          <p className="text-sm font-medium mb-2">Target hit rate</p>
          <p className="text-xs text-muted mb-2">
            % of training days where the daily target was met
          </p>
          {EXERCISE_ORDER.map((exType) => {
            const rate = targetHitRate[exType];
            if (!rate) return null;
            return <HitRateBar key={exType} exType={exType} rate={rate} />;
          })}
        </div>
      )}
    </section>
  );
}

function HitRateBar({
  exType,
  rate,
}: {
  exType: ExerciseType;
  rate: ExerciseRate;
}) {
  const exercise = EXERCISE[exType];
  const pct = Math.round(rate.rate * 100);
  return (
    <div className="not-last:mb-2">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <Icon
            name={exType as IconName}
            size={16}
            style={{ color: exercise.color }}
          />
          <span className="text-sm">{exercise.label}</span>
        </div>
        <span className="text-sm tabular-nums font-medium">
          {pct}%
          <span className="text-xs text-muted ml-1">
            ({rate.hit}/{rate.total})
          </span>
        </span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden bg-border/30">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${pct}%`,
            backgroundColor: exercise.color,
          }}
        />
      </div>
    </div>
  );
}

function VolumeSection({ stats }: { stats: ComputedStats }) {
  const { weeklyTotal, weekOverWeek, allTimeTotal, grandTotal } = stats;

  return (
    <section className="section">
      <h2 className="text-h2 mb-3">Volume & Totals</h2>
      <p className="text-xs text-muted mb-3">
        How much you train in total
      </p>

      <div className="mb-4">
        <p className="text-sm font-medium mb-2">This week</p>
        <p className="text-xs text-muted mb-2">
          Total reps this Mon–Sun vs last week
        </p>
        {EXERCISE_ORDER.map((exType) => {
          const total = weeklyTotal[exType] ?? 0;
          if (total === 0 && !(weekOverWeek[exType] !== undefined)) return null;
          const exercise = EXERCISE[exType];
          const change = weekOverWeek[exType];

          return (
            <div
              key={exType}
              className="flex items-center justify-between not-last:mb-2"
            >
              <div className="flex items-center gap-1.5">
                <Icon
                  name={exType as IconName}
                  size={16}
                  style={{ color: exercise.color }}
                />
                <span className="text-sm">{exercise.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm tabular-nums font-medium">
                  {total.toLocaleString()}
                </span>
                {change !== null && change !== undefined && (
                  <span
                    className="text-xs tabular-nums"
                    style={{
                      color: change >= 0 ? "#46A758" : "#E5484D",
                    }}
                  >
                    {change >= 0 ? "+" : ""}
                    {Math.round(change)}%
                  </span>
                )}
                {change === null && total > 0 && (
                  <span className="text-xs text-muted">new</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div>
        <p className="text-sm font-medium mb-2">All-time total</p>
        <p className="text-xs text-muted mb-2">
          Total reps since you started tracking
        </p>
        <div className="grid grid-cols-2 gap-3">
          {EXERCISE_ORDER.map((exType) => {
            const total = allTimeTotal[exType];
            if (!total) return null;
            const exercise = EXERCISE[exType];
            return (
              <div
                key={exType}
                className="p-3 rounded-xl bg-canvas2 flex items-center gap-2"
              >
                <Icon
                  name={exType as IconName}
                  size={20}
                  style={{ color: exercise.color }}
                />
                <div>
                  <p className="text-xs text-muted">{exercise.label}</p>
                  <p className="text-h3 tabular-nums">
                    {total.toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-muted mt-2 text-right">
          Grand total: {grandTotal.toLocaleString()} reps
        </p>
      </div>
    </section>
  );
}

function IntensitySection({ stats }: { stats: ComputedStats }) {
  const { avgRepsPerSet, bestSet, setsPerDay, maxDailyVolume } = stats;

  return (
    <section className="section">
      <h2 className="text-h2 mb-3">Sets & Intensity</h2>
      <p className="text-xs text-muted mb-3">
        How hard you push in each session
      </p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <p className="text-sm font-medium mb-2">Avg reps/set</p>
          <p className="text-xs text-muted mb-2">Mean set size</p>
          <ExerciseMetricList
            data={avgRepsPerSet}
            formatValue={(v) => String(v)}
          />
        </div>
        <div>
          <p className="text-sm font-medium mb-2">Best set</p>
          <p className="text-xs text-muted mb-2">Personal record</p>
          <ExerciseRecordList data={bestSet} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-sm font-medium mb-2">Sets/day</p>
          <p className="text-xs text-muted mb-2">Avg per training day</p>
          <ExerciseMetricList
            data={setsPerDay}
            formatValue={(v) => String(v)}
          />
        </div>
        <div>
          <p className="text-sm font-medium mb-2">Best day</p>
          <p className="text-xs text-muted mb-2">Max daily volume</p>
          <ExerciseRecordList data={maxDailyVolume} />
        </div>
      </div>
    </section>
  );
}

function ExerciseMetricList({
  data,
  formatValue,
}: {
  data: Partial<Record<ExerciseType, number>>;
  formatValue: (v: number) => string;
}) {
  return (
    <ul>
      {EXERCISE_ORDER.map((exType) => {
        const val = data[exType];
        if (val === undefined) return null;
        const exercise = EXERCISE[exType];
        return (
          <li key={exType} className="flex items-center gap-1.5 not-last:mb-1">
            <Icon
              name={exType as IconName}
              size={14}
              style={{ color: exercise.color }}
            />
            <span className="text-sm tabular-nums font-medium">
              {formatValue(val)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function ExerciseRecordList({
  data,
}: {
  data: Partial<Record<ExerciseType, ExerciseRecord>>;
}) {
  return (
    <ul>
      {EXERCISE_ORDER.map((exType) => {
        const rec = data[exType];
        if (!rec) return null;
        const exercise = EXERCISE[exType];
        return (
          <li key={exType} className="flex items-center gap-1.5 not-last:mb-1">
            <Icon
              name={exType as IconName}
              size={14}
              style={{ color: exercise.color }}
            />
            <span className="text-sm tabular-nums font-medium">
              {rec.count}
            </span>
            <span className="text-xs text-muted">{formatDate(rec.date)}</span>
          </li>
        );
      })}
    </ul>
  );
}

function PatternsSection({ stats }: { stats: ComputedStats }) {
  const { dayOfWeekHeatmap, exerciseBalance } = stats;
  const maxAvg = Math.max(...dayOfWeekHeatmap.map((d) => d.avg), 1);

  return (
    <section className="section">
      <h2 className="text-h2 mb-3">Trends & Patterns</h2>
      <p className="text-xs text-muted mb-3">
        When and what you train most
      </p>

      <div className="mb-4">
        <p className="text-sm font-medium mb-2">Most active days</p>
        <p className="text-xs text-muted mb-2">
          Average total reps by day of week
        </p>
        {dayOfWeekHeatmap.map((wd) => (
          <div key={wd.day} className="flex items-center gap-2 not-last:mb-1.5">
            <span className="text-xs w-7 text-muted">{wd.day}</span>
            <div className="flex-1 h-4 rounded bg-border/20 overflow-hidden">
              <div
                className="h-full rounded bg-brand transition-all"
                style={{
                  width: `${maxAvg > 0 ? (wd.avg / maxAvg) * 100 : 0}%`,
                }}
              />
            </div>
            <span className="text-xs tabular-nums w-10 text-right">
              {wd.avg > 0 ? wd.avg : "—"}
            </span>
          </div>
        ))}
      </div>

      <div>
        <p className="text-sm font-medium mb-2">Exercise balance</p>
        <p className="text-xs text-muted mb-2">
          Share of each exercise in your total volume
        </p>
        <div className="h-4 rounded-full overflow-hidden flex mb-2">
          {EXERCISE_ORDER.map((exType) => {
            const pct = exerciseBalance[exType] ?? 0;
            if (pct === 0) return null;
            return (
              <div
                key={exType}
                className="h-full transition-all"
                style={{
                  width: `${pct}%`,
                  backgroundColor: EXERCISE[exType].color,
                }}
              />
            );
          })}
        </div>
        <div className="grid grid-cols-2 gap-1">
          {EXERCISE_ORDER.map((exType) => {
            const pct = exerciseBalance[exType];
            if (pct === undefined) return null;
            const exercise = EXERCISE[exType];
            return (
              <div key={exType} className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block"
                  style={{ backgroundColor: exercise.color }}
                />
                <span className="text-xs">
                  {exercise.label}{" "}
                  <span className="tabular-nums font-medium">{pct}%</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function RecordsSection({ stats }: { stats: ComputedStats }) {
  const { bestSet, maxDailyVolume, longestStreak } = stats;

  return (
    <section className="section">
      <h2 className="text-h2 mb-3">Personal Records</h2>
      <p className="text-xs text-muted mb-3">
        Your all-time bests
      </p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <p className="text-sm font-medium mb-2">Best single set</p>
          <ExerciseRecordList data={bestSet} />
        </div>
        <div>
          <p className="text-sm font-medium mb-2">Best day total</p>
          <ExerciseRecordList data={maxDailyVolume} />
        </div>
      </div>

      {longestStreak.length > 0 && (
        <div className="p-3 rounded-xl bg-canvas2">
          <p className="text-xs text-muted mb-1">Longest streak</p>
          <p className="text-h2 tabular-nums">{longestStreak.length} days</p>
          <p className="text-xs text-muted mt-1">
            {formatDateRange(longestStreak.startDate, longestStreak.endDate)}
          </p>
        </div>
      )}
    </section>
  );
}
