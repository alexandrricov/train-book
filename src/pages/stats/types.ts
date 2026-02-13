import type { ExerciseType } from "../../types";

export type ExerciseRecord = {
  count: number;
  date: string;
};

export type ExerciseRate = {
  hit: number;
  total: number;
  rate: number;
};

export type WeekdayData = {
  day: string;
  total: number;
  count: number;
  avg: number;
};

export type ComputedStats = {
  currentStreak: number;
  longestStreak: { length: number; startDate: string; endDate: string };
  weeklyConsistency: { trained: number; total: 7 };
  targetHitRate: Partial<Record<ExerciseType, ExerciseRate>>;

  weeklyTotal: Partial<Record<ExerciseType, number>>;
  weekOverWeek: Partial<Record<ExerciseType, number | null>>;
  allTimeTotal: Partial<Record<ExerciseType, number>>;
  grandTotal: number;

  avgRepsPerSet: Partial<Record<ExerciseType, number>>;
  bestSet: Partial<Record<ExerciseType, ExerciseRecord>>;
  setsPerDay: Partial<Record<ExerciseType, number>>;
  maxDailyVolume: Partial<Record<ExerciseType, ExerciseRecord>>;

  dayOfWeekHeatmap: WeekdayData[];
  exerciseBalance: Partial<Record<ExerciseType, number>>;

  totalDays: number;
  firstDate: string;
  lastDate: string;
};
