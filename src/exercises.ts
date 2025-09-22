export const EXERCISE_LABELS = {
  pushup: "Push-ups",
  pullup: "Pull-ups",
  squat: "Squats",
  abs: "Abs",
} as const;

export const EXERCISE_ORDER: (keyof typeof EXERCISE_LABELS)[] = [
  "pushup",
  "pullup",
  "squat",
  "abs",
] as const;
