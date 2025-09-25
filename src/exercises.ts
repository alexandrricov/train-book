export const EXERCISE = {
  pushup: {
    label: "Push-ups",
    color: "#FF6B6B",
  },
  pullup: {
    label: "Pull-ups",
    color: "#4ECDC4",
  },
  squat: {
    label: "Squats",
    color: "#FFD93D",
  },
  abs: {
    label: "Abs",
    color: "#1A535C",
  },
};

// export const EXERCISE_LABELS = {
//   pushup: "Push-ups",
//   pullup: "Pull-ups",
//   squat: "Squats",
//   abs: "Abs",
// } as const;

export const EXERCISE_ORDER: (keyof typeof EXERCISE)[] = [
  "pushup",
  "pullup",
  "squat",
  "abs",
] as const;
