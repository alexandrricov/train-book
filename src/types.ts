export type ExerciseType = "pushup" | "pullup" | "squat" | "abs";

export type SetRow = {
  id: string;
  date: string;
  type: ExerciseType;
  count: number;
};
