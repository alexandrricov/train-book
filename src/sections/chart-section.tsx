import { useEffect, useMemo, useRef, useState } from "react";
import type { SetRow, ExerciseType, TargetsAsOf } from "../types";
import { subscribeItems, subscribeTargets } from "../firebase-db";
import uPlot from "uplot";
import "uplot/dist/uPlot.min.css";
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
  { id: PeriodTabsKey.week, children: "1 week" },
  { id: PeriodTabsKey.month, children: "1 month" },
  { id: PeriodTabsKey.all, children: "All" },
];

function formatTick(date: Date, filter: PeriodTabsKey): string {
  switch (filter) {
    case PeriodTabsKey.week:
      return date.toLocaleDateString(undefined, { weekday: "short" });
    case PeriodTabsKey.month:
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

interface TooltipState {
  x: number;
  y: number;
  idx: number;
}

function createTargetLinesPlugin(targets: TargetsAsOf): uPlot.Plugin {
  return {
    hooks: {
      draw: (u: uPlot) => {
        const ctx = u.ctx;
        for (const [type, data] of Object.entries(targets)) {
          if (!data) continue;
          const color = EXERCISE[type as ExerciseType].color;
          const yPos = u.valToPos(data.value, "y", true);
          const left = u.bbox.left;
          const right = u.bbox.left + u.bbox.width;

          ctx.save();
          ctx.beginPath();
          ctx.setLineDash([6, 6]);
          ctx.strokeStyle = color;
          ctx.lineWidth = devicePixelRatio;
          ctx.globalAlpha = 0.7;
          ctx.moveTo(left, yPos);
          ctx.lineTo(right, yPos);
          ctx.stroke();
          ctx.restore();
        }
      },
    },
  };
}

export function ChartSection() {
  const [periodFilter, setPeriodFilter] = useState<PeriodTabsKey>(
    PeriodTabsKey.month
  );
  const [items, setItems] = useState<SetRow[]>([]);
  const [targets, setTargets] = useState<TargetsAsOf>({});
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<uPlot | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [themeKey, setThemeKey] = useState(0);

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
    const unsubItems = subscribeItems(setItems, days);
    return () => {
      unsubItems();
    };
  }, [periodFilter]);

  useEffect(() => {
    const unsubscribeTargets = subscribeTargets(toDateString(), setTargets);
    return () => {
      unsubscribeTargets();
    };
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => setThemeKey((k) => k + 1);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const [dates, types] = useMemo(() => {
    if (items.length === 0) return [[], []];

    const _dates = [...new Set(items.map((item) => item.date))].sort((a, b) =>
      a < b ? -1 : a > b ? 1 : 0
    );

    const _types = [...new Set(items.map((item) => item.type))].sort(
      (a, b) => {
        const orderA = EXERCISE_ORDER.indexOf(a as ExerciseType);
        const orderB = EXERCISE_ORDER.indexOf(b as ExerciseType);
        return orderA < orderB ? -1 : orderA > orderB ? 1 : 0;
      }
    );

    return [_dates, _types];
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
      if (!byDate.has(it.date)) byDate.set(it.date, new Map());
      const typeMap = byDate.get(it.date)!;
      typeMap.set(it.type, (typeMap.get(it.type) || 0) + it.count);
    }

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

  // Must be memoized — otherwise tooltip setTooltip → re-render →
  // new groupedItems ref → new uPlotData → useEffect destroys/recreates chart
  const groupedItems = useMemo(
    () => groupItemsByDateAndType(items as SetRow[]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, dates]
  );

  const uPlotData: uPlot.AlignedData = useMemo(() => {
    const xValues = groupedItems.map((row) => {
      const [y, m, d] = row.date.split("-").map(Number);
      return Date.UTC(y, m - 1, d) / 1000;
    });

    const seriesArrays = types.map((type) =>
      groupedItems.map((row) => row[type] ?? null)
    );

    return [xValues, ...seriesArrays];
  }, [groupedItems, types]);

  const yHigh = useMemo(() => {
    let max = 0;
    for (const row of groupedItems) {
      for (const type of types) {
        const v = row[type];
        if (v != null && v > max) max = v;
      }
    }
    for (const [, data] of Object.entries(targets)) {
      if (data.value > max) max = data.value;
    }
    return max + 10;
  }, [groupedItems, types, targets]);

  // Chart creation — all options + hooks inline, following reference pattern
  useEffect(() => {
    if (!containerRef.current || uPlotData[0].length === 0) return;

    void themeKey;
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const gridColor = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)";
    const textColor = isDark ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.7)";
    const splinePaths = uPlot.paths.spline?.();

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const opts: uPlot.Options = {
      width: containerRef.current.clientWidth,
      height: 300,
      padding: [10, 16, 0, 0],

      cursor: {
        y: false,
        drag: { x: false, y: false, setScale: false },
        points: {
          size: 8,
          fill: "#fff",
          width: 2,
        },
      },

      focus: { alpha: 0.3 },

      legend: { show: false },

      scales: {
        x: { time: true },
        y: { range: [0, yHigh] },
      },

      axes: [
        {
          stroke: textColor,
          grid: { stroke: gridColor, dash: [4, 8], width: 1 },
          ticks: { stroke: gridColor, width: 1 },
          values: (_: uPlot, ticks: number[]) =>
            ticks.map((ts) => formatTick(new Date(ts * 1000), periodFilter)),
          space: periodFilter === PeriodTabsKey.week ? 60 : 80,
        },
        {
          stroke: textColor,
          size: 45,
          grid: { stroke: gridColor, dash: [4, 8], width: 1 },
          ticks: { stroke: gridColor, width: 1 },
          space: 40,
          values: (_: uPlot, ticks: number[]) =>
            ticks.map((v) => (Number.isInteger(v) ? String(v) : "")),
        },
      ],

      series: [
        {},
        ...types.map((type) => ({
          label: EXERCISE[type].label,
          stroke: EXERCISE[type].color,
          width: 2,
          spanGaps: true,
          points: {
            size: 8,
            stroke: EXERCISE[type].color,
            fill: EXERCISE[type].color,
          },
          ...(splinePaths ? { paths: splinePaths } : {}),
        })),
      ],

      plugins: [createTargetLinesPlugin(targets)],

      hooks: {
        setCursor: [
          (u) => {
            const idx = u.cursor.idx;
            if (idx == null || u.data[0][idx] == null || !wrapperRef.current) {
              setTooltip(null);
              return;
            }
            // Skip dates with no values across all series
            const hasValue = u.series.some(
              (_, si) => si > 0 && (u.data[si] as (number | null | undefined)[])[idx] != null
            );
            if (!hasValue) {
              setTooltip(null);
              return;
            }
            // cursor.left/top are relative to the over canvas;
            // offset them to the wrapper (tooltip positioning context)
            const overRect = u.over.getBoundingClientRect();
            const wrapRect = wrapperRef.current.getBoundingClientRect();
            const left = (u.cursor.left ?? 0) + overRect.left - wrapRect.left;
            const top = (u.cursor.top ?? 0) + overRect.top - wrapRect.top;
            setTooltip({ x: left, y: top, idx });
          },
        ],
      },
    };

    chartRef.current = new uPlot(opts, uPlotData, containerRef.current);

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (chartRef.current) {
          chartRef.current.setSize({
            width: entry.contentRect.width,
            height: 300,
          });
        }
      }
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [uPlotData, types, yHigh, periodFilter, targets, themeKey]);

  const tooltipRow = tooltip ? groupedItems[tooltip.idx] : null;
  const tooltipEntries = tooltipRow
    ? types
        .map((type) => ({
          type: type as ExerciseType,
          value: tooltipRow[type] ?? null,
        }))
        .filter((e) => e.value != null)
    : [];

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
      <div ref={wrapperRef} className="relative w-full">
        <div ref={containerRef} className="w-full" />
        {tooltip && tooltipRow && (
          <article
            className="absolute z-10 p-4 bg-canvas border border-border rounded shadow pointer-events-none whitespace-nowrap"
            style={{
              left: Math.max(90, Math.min(tooltip.x, (wrapperRef.current?.clientWidth ?? 0) - 90)),
              top: tooltip.y - 12,
              transform: "translate(-50%, -100%)",
            }}
          >
            <h3 className="mb-2">
              {new Intl.DateTimeFormat(undefined, {
                dateStyle: "medium",
              }).format(new Date(tooltipRow.date))}
            </h3>
            <dl>
              {tooltipEntries.map((entry) => (
                <div
                  key={entry.type}
                  style={{ color: EXERCISE[entry.type].color }}
                  className="flex gap-2 items-center justify-between"
                >
                  <dt className="flex gap-2 items-center">
                    <Icon
                      name={entry.type}
                      className="size-5"
                      style={{ color: EXERCISE[entry.type].color }}
                    />
                    {EXERCISE[entry.type].label}
                  </dt>
                  <dd>{entry.value}</dd>
                </div>
              ))}
            </dl>
          </article>
        )}
      </div>
      <ul className="flex flex-wrap gap-2 items-center justify-center mt-2">
        {types
          .sort((a, b) => {
            const orderA = EXERCISE_ORDER.indexOf(a as ExerciseType);
            const orderB = EXERCISE_ORDER.indexOf(b as ExerciseType);
            return orderA - orderB;
          })
          .map((type) => (
            <li
              key={type}
              style={{ color: EXERCISE[type].color }}
              className="flex gap-2 items-center"
            >
              <Icon
                name={type}
                className="size-5"
                style={{ color: EXERCISE[type].color }}
              />
              {EXERCISE[type].label}
            </li>
          ))}
      </ul>
    </section>
  );
}
