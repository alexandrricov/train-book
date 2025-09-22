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
