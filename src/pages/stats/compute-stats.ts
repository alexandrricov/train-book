import type { ExerciseType, SetRowDB, TargetRowDB } from "../../types";
import { EXERCISE_ORDER } from "../../exercises";
import { toDateString } from "../../utils/date";
import type {
  ComputedStats,
  ExerciseRate,
  ExerciseRecord,
  WeekdayData,
} from "./types";

type DayData = {
  date: string;
  sets: SetRowDB[];
  totalsByType: Partial<Record<ExerciseType, number>>;
  setsByType: Partial<Record<ExerciseType, SetRowDB[]>>;
  totalReps: number;
};

function buildDayMap(items: SetRowDB[]): Map<string, DayData> {
  const map = new Map<string, DayData>();
  for (const item of items) {
    let day = map.get(item.date);
    if (!day) {
      day = {
        date: item.date,
        sets: [],
        totalsByType: {},
        setsByType: {},
        totalReps: 0,
      };
      map.set(item.date, day);
    }
    day.sets.push(item);
    day.totalsByType[item.type] =
      (day.totalsByType[item.type] ?? 0) + item.count;
    if (!day.setsByType[item.type]) day.setsByType[item.type] = [];
    day.setsByType[item.type]!.push(item);
    day.totalReps += item.count;
  }
  return map;
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return toDateString(d);
}

function getMondayOfWeek(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return toDateString(d);
}

function computeCurrentStreak(
  dayMap: Map<string, DayData>,
  today: string
): number {
  let count = 0;
  let current = today;
  while (dayMap.has(current)) {
    count++;
    current = addDays(current, -1);
  }
  return count;
}

function computeLongestStreak(
  sortedDates: string[]
): ComputedStats["longestStreak"] {
  if (sortedDates.length === 0)
    return { length: 0, startDate: "", endDate: "" };

  let maxLen = 1;
  let maxStart = sortedDates[0];
  let maxEnd = sortedDates[0];
  let curLen = 1;
  let curStart = sortedDates[0];

  for (let i = 1; i < sortedDates.length; i++) {
    const expected = addDays(sortedDates[i - 1], 1);
    if (sortedDates[i] === expected) {
      curLen++;
    } else {
      if (curLen > maxLen) {
        maxLen = curLen;
        maxStart = curStart;
        maxEnd = sortedDates[i - 1];
      }
      curLen = 1;
      curStart = sortedDates[i];
    }
  }
  if (curLen > maxLen) {
    maxLen = curLen;
    maxStart = curStart;
    maxEnd = sortedDates[sortedDates.length - 1];
  }

  return { length: maxLen, startDate: maxStart, endDate: maxEnd };
}

function computeWeeklyConsistency(
  dayMap: Map<string, DayData>,
  today: string
): ComputedStats["weeklyConsistency"] {
  const monday = getMondayOfWeek(today);
  let trained = 0;
  for (let i = 0; i < 7; i++) {
    const d = addDays(monday, i);
    if (d > today) break;
    if (dayMap.has(d)) trained++;
  }
  return { trained, total: 7 };
}

function computeTargetHitRate(
  dayMap: Map<string, DayData>,
  targets: TargetRowDB[]
): Partial<Record<ExerciseType, ExerciseRate>> {
  const result: Partial<Record<ExerciseType, ExerciseRate>> = {};

  for (const exType of EXERCISE_ORDER) {
    const timeline = targets
      .filter((t) => t.type === exType)
      .sort((a, b) => a.date.localeCompare(b.date));

    if (timeline.length === 0) continue;

    let hit = 0;
    let total = 0;

    for (const [date, day] of dayMap) {
      let activeTarget: number | null = null;
      for (let i = timeline.length - 1; i >= 0; i--) {
        if (timeline[i].date <= date) {
          activeTarget = timeline[i].value;
          break;
        }
      }
      if (activeTarget === null) continue;

      total++;
      const dayTotal = day.totalsByType[exType] ?? 0;
      if (dayTotal >= activeTarget) hit++;
    }

    if (total > 0) {
      result[exType] = { hit, total, rate: hit / total };
    }
  }

  return result;
}

function getWeekDates(
  monday: string,
  today: string
): string[] {
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = addDays(monday, i);
    if (d > today) break;
    dates.push(d);
  }
  return dates;
}

function sumWeek(
  dayMap: Map<string, DayData>,
  weekDates: string[]
): Partial<Record<ExerciseType, number>> {
  const totals: Partial<Record<ExerciseType, number>> = {};
  for (const d of weekDates) {
    const day = dayMap.get(d);
    if (!day) continue;
    for (const exType of EXERCISE_ORDER) {
      totals[exType] = (totals[exType] ?? 0) + (day.totalsByType[exType] ?? 0);
    }
  }
  return totals;
}

function computeWeeklyTotal(
  dayMap: Map<string, DayData>,
  today: string
): Partial<Record<ExerciseType, number>> {
  const monday = getMondayOfWeek(today);
  return sumWeek(dayMap, getWeekDates(monday, today));
}

function computeWeekOverWeek(
  dayMap: Map<string, DayData>,
  today: string
): Partial<Record<ExerciseType, number | null>> {
  const monday = getMondayOfWeek(today);
  const prevMonday = addDays(monday, -7);
  const prevSunday = addDays(monday, -1);

  const currentWeek = sumWeek(dayMap, getWeekDates(monday, today));
  const prevWeekDates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = addDays(prevMonday, i);
    if (d > prevSunday) break;
    prevWeekDates.push(d);
  }
  const prevWeek = sumWeek(dayMap, prevWeekDates);

  const result: Partial<Record<ExerciseType, number | null>> = {};
  for (const exType of EXERCISE_ORDER) {
    const cur = currentWeek[exType] ?? 0;
    const prev = prevWeek[exType] ?? 0;
    if (prev === 0) {
      result[exType] = cur > 0 ? null : null;
    } else {
      result[exType] = ((cur - prev) / prev) * 100;
    }
  }
  return result;
}

function computeAllTimeTotal(
  items: SetRowDB[]
): Partial<Record<ExerciseType, number>> {
  const totals: Partial<Record<ExerciseType, number>> = {};
  for (const item of items) {
    totals[item.type] = (totals[item.type] ?? 0) + item.count;
  }
  return totals;
}

function computeAvgRepsPerSet(
  items: SetRowDB[]
): Partial<Record<ExerciseType, number>> {
  const sums: Partial<Record<ExerciseType, number>> = {};
  const counts: Partial<Record<ExerciseType, number>> = {};
  for (const item of items) {
    sums[item.type] = (sums[item.type] ?? 0) + item.count;
    counts[item.type] = (counts[item.type] ?? 0) + 1;
  }
  const result: Partial<Record<ExerciseType, number>> = {};
  for (const exType of EXERCISE_ORDER) {
    const s = sums[exType];
    const c = counts[exType];
    if (s !== undefined && c) {
      result[exType] = Math.round((s / c) * 10) / 10;
    }
  }
  return result;
}

function computeBestSet(
  items: SetRowDB[]
): Partial<Record<ExerciseType, ExerciseRecord>> {
  const result: Partial<Record<ExerciseType, ExerciseRecord>> = {};
  for (const item of items) {
    const cur = result[item.type];
    if (!cur || item.count > cur.count) {
      result[item.type] = { count: item.count, date: item.date };
    }
  }
  return result;
}

function computeSetsPerDay(
  items: SetRowDB[]
): Partial<Record<ExerciseType, number>> {
  const setCount: Partial<Record<ExerciseType, number>> = {};
  const daySet: Partial<Record<ExerciseType, Set<string>>> = {};
  for (const item of items) {
    setCount[item.type] = (setCount[item.type] ?? 0) + 1;
    if (!daySet[item.type]) daySet[item.type] = new Set();
    daySet[item.type]!.add(item.date);
  }
  const result: Partial<Record<ExerciseType, number>> = {};
  for (const exType of EXERCISE_ORDER) {
    const sets = setCount[exType];
    const days = daySet[exType]?.size;
    if (sets && days) {
      result[exType] = Math.round((sets / days) * 10) / 10;
    }
  }
  return result;
}

function computeMaxDailyVolume(
  dayMap: Map<string, DayData>
): Partial<Record<ExerciseType, ExerciseRecord>> {
  const result: Partial<Record<ExerciseType, ExerciseRecord>> = {};
  for (const [, day] of dayMap) {
    for (const exType of EXERCISE_ORDER) {
      const total = day.totalsByType[exType] ?? 0;
      if (total === 0) continue;
      const cur = result[exType];
      if (!cur || total > cur.count) {
        result[exType] = { count: total, date: day.date };
      }
    }
  }
  return result;
}

const WEEKDAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function computeDayOfWeekHeatmap(
  dayMap: Map<string, DayData>
): WeekdayData[] {
  const totals = new Array(7).fill(0) as number[];
  const counts = new Array(7).fill(0) as number[];

  for (const [dateStr, day] of dayMap) {
    const d = new Date(dateStr + "T00:00:00");
    const jsDay = d.getDay();
    const idx = jsDay === 0 ? 6 : jsDay - 1;
    totals[idx] += day.totalReps;
    counts[idx]++;
  }

  return WEEKDAY_NAMES.map((name, i) => ({
    day: name,
    total: totals[i],
    count: counts[i],
    avg: counts[i] > 0 ? Math.round(totals[i] / counts[i]) : 0,
  }));
}

function computeExerciseBalance(
  items: SetRowDB[]
): Partial<Record<ExerciseType, number>> {
  const totals = computeAllTimeTotal(items);
  let grand = 0;
  for (const v of Object.values(totals)) grand += v ?? 0;
  if (grand === 0) return {};

  const result: Partial<Record<ExerciseType, number>> = {};
  for (const exType of EXERCISE_ORDER) {
    const t = totals[exType] ?? 0;
    result[exType] = Math.round((t / grand) * 1000) / 10;
  }
  return result;
}

export function computeAllStats(
  items: SetRowDB[],
  targets: TargetRowDB[]
): ComputedStats {
  const dayMap = buildDayMap(items);
  const today = toDateString();
  const sortedDates = Array.from(dayMap.keys()).sort();

  const allTimeTotal = computeAllTimeTotal(items);
  let grandTotal = 0;
  for (const v of Object.values(allTimeTotal)) grandTotal += v ?? 0;

  return {
    currentStreak: computeCurrentStreak(dayMap, today),
    longestStreak: computeLongestStreak(sortedDates),
    weeklyConsistency: computeWeeklyConsistency(dayMap, today),
    targetHitRate: computeTargetHitRate(dayMap, targets),

    weeklyTotal: computeWeeklyTotal(dayMap, today),
    weekOverWeek: computeWeekOverWeek(dayMap, today),
    allTimeTotal,
    grandTotal,

    avgRepsPerSet: computeAvgRepsPerSet(items),
    bestSet: computeBestSet(items),
    setsPerDay: computeSetsPerDay(items),
    maxDailyVolume: computeMaxDailyVolume(dayMap),

    dayOfWeekHeatmap: computeDayOfWeekHeatmap(dayMap),
    exerciseBalance: computeExerciseBalance(items),

    totalDays: dayMap.size,
    firstDate: sortedDates[0] ?? "",
    lastDate: sortedDates[sortedDates.length - 1] ?? "",
  };
}
