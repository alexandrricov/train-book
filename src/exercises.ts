export const EXERCISE_LABELS: Record<string, string> = {
  pushup: "Push-ups",
  pullup: "Pull-ups",
  squat: "Squats",
  abs: "Abs",
};

export const EXERCISE_ORDER: (keyof typeof EXERCISE_LABELS)[] = [
  "pushup",
  "pullup",
  "squat",
  "abs",
] as const;
