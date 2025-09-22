export const EXERCISE = {
  pushup: {
    label: "Push-ups",
    color: "#8884d8",
  },
  pullup: {
    label: "Pull-ups",
    color: "#82ca9d",
  },
  squat: {
    label: "Squats",
    color: "#ffc658",
  },
  abs: {
    label: "Abs",
    color: "#ff7300",
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
