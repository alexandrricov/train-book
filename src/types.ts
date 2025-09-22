import type { Timestamp } from "firebase/firestore";

export type ExerciseType = "pushup" | "pullup" | "squat" | "abs";

export type SetRow = {
  id: string;
  date: string;
  type: ExerciseType;
  count: number;
};

export type SetRowDB = SetRow & {
  createdAt: Timestamp;
};
