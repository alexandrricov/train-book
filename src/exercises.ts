export const EXERCISE = {
  pushup: {
    label: "Push-ups",
    color: "#E5484D",
  },
  pullup: {
    label: "Pull-ups",
    color: "#00A2C7",
  },
  squat: {
    label: "Squats",
    color: "#46A758",
  },
  abs: {
    label: "Abs",
    color: "#8E4EC6",
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
