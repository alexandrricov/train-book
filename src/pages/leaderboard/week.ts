import { toDateString } from "../../utils/date";
import type { ExerciseType } from "../../types";

/** Monday (YYYY-MM-DD) of the week containing `dateStr`. Used as a week key. */
export function mondayOf(dateStr: string = toDateString()): string {
  const d = new Date(dateStr + "T00:00:00");
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return toDateString(d);
}

export type ExerciseTotals = Record<ExerciseType, number>;

export const ZERO_TOTALS: ExerciseTotals = {
  pushup: 0,
  pullup: 0,
  squat: 0,
  abs: 0,
};

/** Densify a Partial<Record> into a full record with 0 defaults (no undefined for Firestore). */
export function dense(p: Partial<Record<ExerciseType, number>>): ExerciseTotals {
  return {
    pushup: p.pushup ?? 0,
    pullup: p.pullup ?? 0,
    squat: p.squat ?? 0,
    abs: p.abs ?? 0,
  };
}
