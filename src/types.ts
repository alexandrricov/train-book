import type { Timestamp } from "firebase/firestore";
import type { EXERCISE } from "./exercises";

export type ExerciseType = keyof typeof EXERCISE;

export type SetRow = {
  id: string;
  date: string;
  type: ExerciseType;
  count: number;
};

export type SetRowDB = SetRow & {
  createdAt: Timestamp;
};

export type TargetRow = {
  id: string;
  type: ExerciseType;
  value: number;
  date: string;
};

export type TargetRowDB = TargetRow & {
  createdAt: Timestamp;
};

export type TargetsAsOf = {
  // map type -> { value, date } if exists on that date
  [T in ExerciseType]?: { value: number; date: string };
};
