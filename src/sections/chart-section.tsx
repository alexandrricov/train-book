import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SetRow, ExerciseType, TargetsAsOf } from "../types";
import { subscribeItems, subscribeTargets } from "../firebase-db";
import { LineChart, Svg, Interpolation } from "chartist";
import type {
  LineChartData,
  LineChartOptions,
  LineChartCreatedEvent,
  PointDrawEvent,
} from "chartist";
import "chartist/dist/index.css";
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

const SERIES_LETTERS = "abcdefghijklmno";

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  date: string;
  seriesIndex: number;
  value: number;
}

export function ChartSection() {
  const [periodFilter, setPeriodFilter] = useState<PeriodTabsKey>(
    PeriodTabsKey.month
  );
  const [items, setItems] = useState<SetRow[]>([]);
  const [targets, setTargets] = useState<TargetsAsOf>({});
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<LineChart | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const tooltipContainerRef = useRef<HTMLDivElement>(null);
  const chartPointsRef = useRef<
    { dateIndex: number; x: number; y: number; date: string }[]
  >([]);

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

  const [dates, types] = useMemo(() => {
    if (items.length === 0) return [[], []];

    const _dates = [...new Set(items.map((item) => item.date))].sort((a, b) =>
      a < b ? -1 : a > b ? 1 : 0
    );

    const _types = [
      ...new Set(items.map((item) => item.type)),
    ].sort((a, b) => {
      const orderA = EXERCISE_ORDER.indexOf(a as ExerciseType);
      const orderB = EXERCISE_ORDER.indexOf(b as ExerciseType);
      return orderA < orderB ? -1 : orderA > orderB ? 1 : 0;
    });

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

  // Build Chartist data
  const chartData: LineChartData = useMemo(
    () => ({
      labels: groupedItems.map((row) => row.date),
      series: types.map((type) => ({
        name: type,
        data: groupedItems.map((row) => row[type] ?? null),
      })),
    }),
    [groupedItems, types]
  );

  // Compute Y-axis high
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

  const chartOptions: LineChartOptions = useMemo(
    () => ({
      fullWidth: true,
      height: 300,
      low: 0,
      high: yHigh,
      chartPadding: { top: 10, right: 16, bottom: 0, left: 0 },
      showPoint: true,
      showLine: true,
      showArea: false,
      lineSmooth: Interpolation.simple({ fillHoles: true }),
      axisX: {
        labelInterpolationFnc: (value: string | number | Date, index: number) => {
          const label = String(value);
          // Show fewer labels when there are many data points
          const total = groupedItems.length;
          if (total > 14) {
            return index % Math.ceil(total / 7) === 0
              ? formatTick(label, periodFilter)
              : null;
          }
          return formatTick(label, periodFilter);
        },
      },
      axisY: {
        onlyInteger: true,
        offset: 30,
      },
    }),
    [yHigh, periodFilter, groupedItems.length]
  );

  // Dynamic CSS for series colors
  const seriesStyles = useMemo(() => {
    return types
      .map((type, i) => {
        const letter = SERIES_LETTERS[i];
        const color = EXERCISE[type].color;
        return `.ct-series-${letter} .ct-line, .ct-series-${letter} .ct-point { stroke: ${color} !important; }`;
      })
      .join("\n");
  }, [types]);

  // Collect all data for a given date index (for tooltip)
  const getTooltipData = useCallback(
    (dateIndex: number) => {
      const row = groupedItems[dateIndex];
      if (!row) return null;
      return {
        date: row.date,
        entries: types
          .map((type) => ({
            type: type as ExerciseType,
            value: row[type] ?? null,
          }))
          .filter((e) => e.value != null),
      };
    },
    [groupedItems, types]
  );

  // Create/update chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    if (chartRef.current) {
      chartRef.current.detach();
    }

    const chart = new LineChart(
      chartContainerRef.current,
      chartData,
      chartOptions
    );
    chartRef.current = chart;

    // Draw reference lines for targets
    chart.on("created", (event: LineChartCreatedEvent) => {
      const { svg, chartRect, axisY } = event;

      for (const [type, data] of Object.entries(targets)) {
        const y = chartRect.y1 - axisY.projectValue(data.value);
        const color = EXERCISE[type as ExerciseType].color;

        new Svg(
          "line",
          {
            x1: chartRect.x1,
            y1: y,
            x2: chartRect.x2,
            y2: y,
            style: `stroke: ${color}; stroke-dasharray: 6 6; stroke-width: 1px; opacity: 0.7;`,
          },
          "ct-target-line",
          svg
        );
      }
    });

    // Collect point positions for proximity-based tooltip
    chartPointsRef.current = [];
    chart.on("draw", (event) => {
      if ((event as PointDrawEvent).type === "point") {
        const pointEvent = event as PointDrawEvent;
        chartPointsRef.current.push({
          dateIndex: pointEvent.index,
          x: pointEvent.x,
          y: pointEvent.y,
          date: String(chartData.labels?.[pointEvent.index] ?? ""),
        });
      }
    });

    // Proximity tooltip: snap to nearest date column by X
    const container = chartContainerRef.current;

    const showNearestTooltip = (clientX: number) => {
      const svg = container.querySelector("svg");
      const containerRect =
        tooltipContainerRef.current?.getBoundingClientRect();
      if (!svg || !containerRect) return;

      const svgRect = svg.getBoundingClientRect();
      const svgX = clientX - svgRect.left;

      // Group points by date, track x and topmost y per column
      const columns = new Map<
        number,
        { x: number; minY: number; date: string }
      >();
      for (const p of chartPointsRef.current) {
        const col = columns.get(p.dateIndex);
        if (!col) {
          columns.set(p.dateIndex, {
            x: p.x,
            minY: p.y,
            date: p.date,
          });
        } else if (p.y < col.minY) {
          col.minY = p.y;
        }
      }

      // Find nearest column
      let nearest: { x: number; minY: number; date: string } | null = null;
      let minDist = Infinity;
      for (const col of columns.values()) {
        const dist = Math.abs(col.x - svgX);
        if (dist < minDist) {
          minDist = dist;
          nearest = col;
        }
      }
      if (!nearest) return;

      const offsetX = svgRect.left - containerRect.left;
      const offsetY = svgRect.top - containerRect.top;

      setTooltip({
        visible: true,
        x: nearest.x + offsetX,
        y: nearest.minY + offsetY,
        date: nearest.date,
        seriesIndex: 0,
        value: 0,
      });
    };

    const handleMouseMove = (e: MouseEvent) => showNearestTooltip(e.clientX);
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) showNearestTooltip(e.touches[0].clientX);
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) showNearestTooltip(e.touches[0].clientX);
    };
    const handleLeave = () => setTooltip(null);

    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    container.addEventListener("touchmove", handleTouchMove, {
      passive: true,
    });
    container.addEventListener("mouseleave", handleLeave);
    container.addEventListener("touchend", handleLeave);

    return () => {
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("mouseleave", handleLeave);
      container.removeEventListener("touchend", handleLeave);
      chart.detach();
      chartRef.current = null;
    };
  }, [chartData, chartOptions, targets, getTooltipData]);

  const tooltipData = tooltip ? getTooltipData(
    groupedItems.findIndex((r) => r.date === tooltip.date)
  ) : null;

  return (
    <section>
      <style>{`
        ${seriesStyles}
        .ct-grid { stroke: var(--color-border) !important; stroke-dasharray: 3 3; }
        .ct-label { color: currentColor !important; fill: currentColor !important; }
        .ct-point { stroke-width: 8px !important; }
        .ct-line { stroke-width: 2px !important; }
      `}</style>
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
      <div ref={tooltipContainerRef} className="relative">
        <div ref={chartContainerRef} className="h-[300px] w-full" />
        {tooltip && tooltipData && (
          <article
            className="absolute z-10 p-4 bg-canvas border border-border rounded shadow pointer-events-none"
            style={{
              left: tooltip.x,
              top: tooltip.y,
              transform: "translate(-50%, -100%) translateY(-12px)",
            }}
          >
            <h3 className="mb-2">
              {new Intl.DateTimeFormat(undefined, {
                dateStyle: "medium",
              }).format(new Date(tooltipData.date))}
            </h3>
            <dl>
              {tooltipData.entries.map((entry) => (
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
