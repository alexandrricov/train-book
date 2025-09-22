import { useEffect, useState } from "react";
import type { SetRow, SetRowDB } from "../types";
import { subscribeMyItems } from "../firebase-db";
import { EXERCISE_LABELS } from "../exercises";
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
} from "recharts";

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

type ExerciseType = keyof typeof EXERCISE_LABELS;

export type DailyTotals = {
  date: string; // "YYYY-MM-DD"
} & Partial<Record<ExerciseType, number>>;

const EXERCISE_COLORS = {
  pushup: "#8884d8",
  pullup: "#82ca9d",
  squat: "#ffc658",
  abs: "#ff7300",
} as const;

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

  function groupItemsByDateAndType(items: SetRowDB[]): DailyTotals[] {
    // 1) Collect all date keys for items
    const itemDateKeys = items.map(getDateKey);
    // 2) Determine start date (min) and end date (today UTC)
    let startYMD: string;
    if (itemDateKeys.length > 0) {
      startYMD = itemDateKeys.reduce((min, cur) => (cur < min ? cur : min));
    } else {
      // If no items, start at today to avoid empty span
      startYMD = dateToYMDUTC(new Date());
    }
    const startDate = ymdToUTCDate(startYMD);
    const todayUTC = new Date(); // current instant
    const endYMD = dateToYMDUTC(todayUTC);
    const endDate = ymdToUTCDate(endYMD);

    // Map<DateKey, Map<Type, Sum>>
    const byDate: Map<
      string,
      Map<keyof typeof EXERCISE_LABELS, number>
    > = new Map();

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

  console.log("groupItems", groupedItems);

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
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="pushup"
              stroke={EXERCISE_COLORS.pushup}
              activeDot={{ r: 8 }}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="pullup"
              stroke={EXERCISE_COLORS.pullup}
              connectNulls
            />
            <Legend />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
