import { useEffect, useMemo, useState } from "react";
import type { SetRow, ExerciseType } from "../types";
import { subscribeItems } from "../firebase-db";
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
import { Select } from "../components/select";
import { toDateString } from "../utils/date";

const PeriodTabsKey = {
  week: "1w",
  month: "30d",
  all: "All",
} as const;
type PeriodTabsKey = (typeof PeriodTabsKey)[keyof typeof PeriodTabsKey];

const periodTabs = [
  {
    id: PeriodTabsKey.week,
    children: "1 week",
  },
  {
    id: PeriodTabsKey.month,
    children: "1 month",
  },
  {
    id: PeriodTabsKey.all,
    children: "All",
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
    case PeriodTabsKey.week:
      return date.toLocaleDateString(undefined, { weekday: "short" });
    case PeriodTabsKey.month:
      return date.toLocaleDateString(undefined, {
        month: "2-digit",
        day: "2-digit",
      });
    case PeriodTabsKey.all:
      return date.toLocaleDateString(undefined, {
        month: "2-digit",
        day: "2-digit",
      });
    default:
      return "";
  }
}

function ymdToUTCDate(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
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
    let days;
    switch (periodFilter) {
      case PeriodTabsKey.week: {
        const d = new Date();
        d.setDate(d.getDate() - 6);
        days = toDateString(d);
        break;
      }
      case PeriodTabsKey.month: {
        const d = new Date();
        d.setMonth(d.getMonth() - 1);
        d.setDate(d.getDate() + 1);
        days = toDateString(d);

        break;
      }
      case PeriodTabsKey.all:
        days = undefined;
        break;
      default:
        days = undefined;
    }
    const unsubItems = subscribeItems(
      setItems,
      days
      //
      // new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    );

    return () => {
      unsubItems();
    };
  }, [periodFilter]);

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

  function groupItemsByDateAndType(items: SetRow[]): DailyTotals[] {
    const startYMD =
      dates.length > 0
        ? dates.reduce((min, cur) => (cur < min ? cur : min))
        : toDateString(new Date());

    const startDate = ymdToUTCDate(startYMD);
    const todayUTC = new Date();
    const endYMD = toDateString(todayUTC);
    const endDate = ymdToUTCDate(endYMD);

    // Map<DateKey, Map<Type, Sum>>
    const byDate: Map<SetRow["date"], Map<ExerciseType, number>> = new Map();

    for (
      let d = new Date(startDate.getTime());
      d.getTime() <= endDate.getTime();
      d.setUTCDate(d.getUTCDate() + 1)
    ) {
      byDate.set(toDateString(d), new Map());
    }

    for (const it of items) {
      if (typeof it?.count !== "number" || !it?.type) continue;
      // Ensure the bucket exists (if item date is outside prefilled range, add it)
      if (!byDate.has(it.date)) byDate.set(it.date, new Map());
      const typeMap = byDate.get(it.date)!;
      typeMap.set(it.type, (typeMap.get(it.type) || 0) + it.count);
    }

    // Build output rows in ascending date order
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

  const groupedItems = groupItemsByDateAndType(items as SetRow[]);

  return (
    <section>
      <header className="flex items-center justify-between mb-4">
        <h2 className="text-h2">History Chart</h2>
        <Select
          name="period"
          id="period"
          value={periodFilter}
          onChange={(e) => setPeriodFilter(e.target.value as PeriodTabsKey)}
          options={periodTabs.map((tab) => ({
            children: tab.children,
            value: tab.id,
          }))}
        />
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
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis
              dataKey="date"
              tickFormatter={(item) => formatTick(item, periodFilter)}
              tick={{ fill: "currentColor" }}
              tickLine={{
                stroke: "var(--color-border)",
              }}
              axisLine={{ stroke: "var(--color-border)" }}
            />
            <YAxis
              width={20}
              domain={[
                (dataMin) => Math.max(0 - Math.abs(dataMin), 0),
                (dataMax) => dataMax + 10,
              ]}
              tick={{ fill: "currentColor" }}
              tickLine={{
                stroke: "var(--color-border)",
              }}
              axisLine={{ stroke: "var(--color-border)" }}
            />
            {types.map((type) => (
              <Line
                key={type}
                type="monotone"
                dataKey={type}
                stroke={EXERCISE[type].color}
                dot={{ fill: "var(--color-canvas)" }}
                activeDot={{ stroke: "var(--color-canvas)" }}
                connectNulls
              />
            ))}
            <Tooltip
              cursor={{ stroke: "var(--color-border)", strokeWidth: 2 }}
              active
              content={({
                active,
                payload,
                label,
              }: TooltipContentProps<number, string>) => {
                if (active && payload && payload.length && label) {
                  return (
                    <article className="p-4 bg-canvas border border-border rounded shadow">
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
            <Legend
              content={({ payload }) => {
                return (
                  <ul className="flex flex-wrap gap-2 items-center justify-center">
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
