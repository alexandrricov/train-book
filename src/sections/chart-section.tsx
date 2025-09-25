import { useEffect, useMemo, useState } from "react";
import type { SetRow, SetRowDB, ExerciseType } from "../types";
import { subscribeMyItems } from "../firebase-db";
import { Timestamp } from "firebase/firestore";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type LegendPayload,
  type TooltipContentProps,
} from "recharts";
import { EXERCISE, EXERCISE_ORDER } from "../exercises";
import { Icon } from "../components/icon";

// function formatDateTime(
//   date: Date | number | string,
//   options: Intl.DateTimeFormatOptions = {
//     year: "numeric",
//     month: "2-digit",
//     day: "2-digit",
//     hour: "2-digit",
//     minute: "2-digit",
//   }
// ): string {
//   if (!date) return "";
//   if (typeof date === "number" || typeof date === "string") {
//     date = new Date(date);
//   }

//   return date.toLocaleString(
//     navigator.language ?? navigator.languages,
//     options
//   );
// }

function formatDate(
  date: Date | number | string,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!date) return "";
  if (typeof date === "number" || typeof date === "string") {
    date = new Date(date);
  }

  return date.toLocaleDateString(
    navigator.language ?? navigator.languages,
    options
  );
}

function formatTime(
  date: Date | number | string,
  options: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit" }
): string {
  if (!date) return "";
  if (typeof date === "number" || typeof date === "string") {
    date = new Date(date);
  }

  return date.toLocaleTimeString(
    navigator.language ?? navigator.languages,
    options
  );
}

const PeriodTabsKey = {
  day: "24h",
  week: "1w",
  month: "30d",
} as const;
type PeriodTabsKey = (typeof PeriodTabsKey)[keyof typeof PeriodTabsKey];

const periodTabs = [
  {
    id: PeriodTabsKey.day,
    children: "24h",
  },
  {
    id: PeriodTabsKey.week,
    children: "1w",
  },
  {
    id: PeriodTabsKey.month,
    children: "1mo",
  },
];

function formatTick(value: string, filter: PeriodTabsKey) {
  if (typeof value !== "string") {
    return "";
  }
  const date = new Date(value);

  if (date.toString() === "Invalid Date") {
    return "";
  }

  switch (filter) {
    case PeriodTabsKey.day:
      return formatTime(date);
    case PeriodTabsKey.week:
      return formatDate(date, { weekday: "short" });
    case PeriodTabsKey.month:
      return formatDate(date, { month: "2-digit", day: "2-digit" });
    default:
      return "";
  }
}

function tsLikeToDate(v: unknown): Date | null {
  // Firestore Timestamp instance
  if (v instanceof Timestamp) return v.toDate();
  // POJO with seconds/nanoseconds
  if (
    v &&
    typeof v === "object" &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    "seconds" in (v as any) &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    typeof (v as any).seconds === "number"
  ) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const secs = (v as any).seconds as number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nanos = (v as any).nanoseconds
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ((v as any).nanoseconds as number)
      : 0;
    return new Date(secs * 1000 + Math.floor(nanos / 1e6));
  }
  // ISO-like string
  if (typeof v === "string") {
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }
  // JS Date
  if (v instanceof Date) return v;
  return null;
}

function getDateKey(item: SetRowDB): string {
  // Prefer explicit string in item.date if it's already a YYYY-MM-DD
  if (typeof item.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(item.date)) {
    return item.date;
  }
  // If item.date is Timestamp-like, derive calendar date in UTC for stability
  const fromDate = tsLikeToDate(item.date) || tsLikeToDate(item.createdAt);
  if (fromDate) {
    const y = fromDate.getUTCFullYear();
    const m = String(fromDate.getUTCMonth() + 1).padStart(2, "0");
    const d = String(fromDate.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  // Fallback: if date is a non-ISO string, try to parse
  if (typeof item.date === "string") {
    const d = new Date(item.date);
    if (!isNaN(d.getTime())) {
      const y = d.getUTCFullYear();
      const m = String(d.getUTCMonth() + 1).padStart(2, "0");
      const dd = String(d.getUTCDate()).padStart(2, "0");
      return `${y}-${m}-${dd}`;
    }
  }
  // Last resort: unknown date bucket
  return "1970-01-01";
}

function ymdToUTCDate(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
}

function dateToYMDUTC(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

export type DailyTotals = {
  date: string; // "YYYY-MM-DD"
} & Partial<Record<ExerciseType, number>>;

export function ChartSection() {
  const [periodFilter, setPeriodFilter] = useState<PeriodTabsKey>(
    PeriodTabsKey.month
  );
  const [items, setItems] = useState<SetRow[]>([]);

  useEffect(() => {
    const unsubItems = subscribeMyItems(setItems);

    return () => {
      unsubItems();
    };
  }, []);

  const [dates, types] = useMemo(() => {
    if (items.length === 0) return [[], []];
    const ds = items.reduce<SetRow["date"][]>((acc, it) => {
      let d: string | null = null;
      if (typeof it.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(it.date)) {
        d = it.date;
      }

      if (d && !acc.includes(d)) acc.push(d);
      return acc;
    }, []);
    ds.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

    const types = items
      .reduce<SetRow["type"][]>((acc, it) => {
        if (it.type && !acc.includes(it.type)) acc.push(it.type);
        return acc;
      }, [])
      .sort((a, b) => {
        const orderA = EXERCISE_ORDER.indexOf(a as ExerciseType);
        const orderB = EXERCISE_ORDER.indexOf(b as ExerciseType);
        return orderA - orderB;
      });

    return [ds, types];
  }, [items]);

  function groupItemsByDateAndType(items: SetRowDB[]): DailyTotals[] {
    const startYMD =
      dates.length > 0
        ? dates.reduce((min, cur) => (cur < min ? cur : min))
        : dateToYMDUTC(new Date());

    const startDate = ymdToUTCDate(startYMD);
    const todayUTC = new Date();
    const endYMD = dateToYMDUTC(todayUTC);
    const endDate = ymdToUTCDate(endYMD);

    // Map<DateKey, Map<Type, Sum>>
    const byDate: Map<SetRow["date"], Map<ExerciseType, number>> = new Map();

    for (
      let d = new Date(startDate.getTime());
      d.getTime() <= endDate.getTime();
      d.setUTCDate(d.getUTCDate() + 1)
    ) {
      byDate.set(dateToYMDUTC(d), new Map());
    }

    // 4) Accumulate counts from items
    for (const it of items) {
      if (typeof it?.count !== "number" || !it?.type) continue;
      const dateKey = getDateKey(it);
      // Ensure the bucket exists (if item date is outside prefilled range, add it)
      if (!byDate.has(dateKey)) byDate.set(dateKey, new Map());
      const typeMap = byDate.get(dateKey)!;
      typeMap.set(it.type, (typeMap.get(it.type) || 0) + it.count);
    }

    // 5) Build output rows in ascending date order
    const rows: DailyTotals[] = Array.from(byDate.entries())
      .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
      .map(([date, typeMap]) => {
        const row: DailyTotals = { date };
        for (const [t, sum] of typeMap.entries()) {
          if (sum !== 0) row[t] = sum;
        }
        return row;
      });

    return rows;
  }

  const groupedItems = groupItemsByDateAndType(items as SetRowDB[]);

  // console.log("groupItems", groupedItems);

  return (
    <section>
      <header>
        <select
          name="period"
          id="period"
          value={periodFilter}
          onChange={(e) => setPeriodFilter(e.target.value as PeriodTabsKey)}
          className="hidden"
        >
          {periodTabs.map((tab) => (
            <option key={tab.id} value={tab.id}>
              {tab.children}
            </option>
          ))}
        </select>
      </header>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            width={500}
            height={300}
            data={groupedItems}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={(item) => formatTick(item, periodFilter)}
            />
            <YAxis
              width={20}
              domain={[
                (dataMin) => Math.max(0 - Math.abs(dataMin), 0),
                (dataMax) => dataMax + 10,
              ]}
            />
            <Tooltip
              active
              content={({
                active,
                payload,
                label,
              }: TooltipContentProps<number, string>) => {
                // console.log("tooltip", active, payload, label);
                if (active && payload && payload.length && label) {
                  return (
                    <article className="p-4 bg-white border rounded shadow">
                      <h3 className="mb-2">
                        {new Intl.DateTimeFormat(undefined, {
                          dateStyle: "medium",
                        }).format(new Date(label))}
                      </h3>
                      <dl className="">
                        {payload
                          ?.sort((a, b) => {
                            const orderA = EXERCISE_ORDER.indexOf(
                              a.value as ExerciseType
                            );
                            const orderB = EXERCISE_ORDER.indexOf(
                              b.value as ExerciseType
                            );
                            return orderA - orderB;
                          })
                          .map((entry, index) => (
                            <div
                              key={`item-${index}`}
                              style={{
                                color: entry.color,
                              }}
                              className="flex gap-2 items-center justify-between"
                            >
                              <dt className="flex gap-2 items-center">
                                <Icon
                                  name={entry.dataKey as ExerciseType}
                                  className="size-5"
                                  style={{
                                    color: entry.color,
                                  }}
                                />
                                {EXERCISE[entry.dataKey as ExerciseType].label}
                              </dt>
                              <dd>{entry.value}</dd>
                            </div>
                          ))}
                      </dl>
                    </article>
                  );
                }
                return null;
              }}
            />
            {types.map((type) => (
              <Line
                key={type}
                type="monotone"
                dataKey={type}
                stroke={EXERCISE[type].color}
                connectNulls
              />
            ))}
            <Legend
              content={({ payload }) => {
                return (
                  <ul className="flex gap-2 items-center justify-center">
                    {(payload as LegendPayload[])
                      ?.sort((a: LegendPayload, b: LegendPayload) => {
                        const orderA = EXERCISE_ORDER.indexOf(
                          a.value as ExerciseType
                        );
                        const orderB = EXERCISE_ORDER.indexOf(
                          b.value as ExerciseType
                        );
                        return orderA - orderB;
                      })
                      .map((entry: LegendPayload, index: number) => (
                        <li
                          key={`item-${index}`}
                          style={{
                            color: EXERCISE[entry.value as ExerciseType].color,
                          }}
                          className="flex gap-2 items-center"
                        >
                          <Icon
                            name={entry.value as ExerciseType}
                            className="size-5"
                            style={{
                              color:
                                EXERCISE[entry.value as ExerciseType].color,
                            }}
                          />
                          {EXERCISE[entry.value as ExerciseType].label}
                        </li>
                      ))}
                  </ul>
                );
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
