import { useEffect, useMemo, useState } from "react";
import { type ExerciseType, type SetRow } from "../types";
import { deleteMyItem, subscribeItems } from "../firebase-db";
import { EXERCISE, EXERCISE_ORDER } from "../exercises";
import { Icon } from "../components/icon";
import { Button } from "../components/action";
import { toDateString } from "../utils/date";

function relativeDay(dateStr: string): string | null {
  const today = toDateString();
  if (dateStr === today) return "Today";
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (dateStr === toDateString(yesterday)) return "Yesterday";
  return null;
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
    new Date(y, m - 1, d)
  );
}

export function History() {
  const [items, setItems] = useState<SetRow[]>([]);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeItems(setItems);
    return () => unsubscribe();
  }, []);

  const groupedItems = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        if (!acc[item.date])
          acc[item.date] = {} as Record<ExerciseType, SetRow[]>;
        if (!acc[item.date][item.type]) acc[item.date][item.type] = [];
        acc[item.date][item.type].push(item);
        return acc;
      },
      {} as Record<string, Record<ExerciseType, SetRow[]>>
    );
  }, [items]);

  const days = useMemo(() => {
    return Object.keys(groupedItems).sort((a, b) => (a > b ? -1 : 1));
  }, [groupedItems]);

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted">No exercises logged yet.</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-h1">History</h1>
        <Button
          variation="secondary"
          size="small"
          onClick={() => setEditing((e) => !e)}
        >
          {editing ? "Done" : "Edit"}
        </Button>
      </div>

      <ul>
        {days.map((d) => {
          const relative = relativeDay(d);
          const formatted = formatDate(d);
          const exerciseTypes = Object.entries(groupedItems[d]).sort(
            ([a], [b]) => {
              return (
                EXERCISE_ORDER.indexOf(a as ExerciseType) -
                EXERCISE_ORDER.indexOf(b as ExerciseType)
              );
            }
          );

          return (
            <li
              key={d}
              className="p-4 rounded-2xl border border-border not-last:mb-4"
            >
              <div className="flex items-baseline justify-between mb-3">
                <h2 className="text-h3">{relative ?? formatted}</h2>
                {relative && (
                  <span className="text-muted text-sm">{formatted}</span>
                )}
              </div>

              {exerciseTypes.map(([type, sets]) => {
                const exercise = EXERCISE[type as ExerciseType];
                const total = sets.reduce((acc, s) => acc + s.count, 0);

                return (
                  <div key={type} className="not-last:mb-2">
                    {/* Summary row */}
                    <div className="flex items-center gap-2">
                      <Icon
                        name={type as ExerciseType}
                        className="size-5 shrink-0"
                        style={{ color: exercise.color }}
                      />
                      <span className="font-medium">{exercise.label}</span>

                      {!editing && sets.length > 1 && (
                        <span className="text-sm text-muted ml-auto tabular-nums">
                          {sets.map((s) => s.count).join(" · ")}
                        </span>
                      )}

                      <span className="font-bold tabular-nums min-w-8 text-right ml-auto">
                        {total}
                      </span>
                    </div>

                    {/* Edit mode: individual sets with delete */}
                    {editing && (
                      <ul className="mt-1 ml-7 space-y-1">
                        {sets.map((set) => (
                          <li
                            key={set.id}
                            className="flex items-center gap-2 text-sm"
                          >
                            <span className="tabular-nums">{set.count}</span>
                            <button
                              type="button"
                              aria-label={`Delete ${exercise.label} set of ${set.count}`}
                              className="text-muted hover:text-canvas-text cursor-pointer ml-auto"
                              onClick={() => {
                                if (window.confirm("Delete this set?")) {
                                  deleteMyItem(set.id);
                                }
                              }}
                            >
                              <Icon name="close" size={16} />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </li>
          );
        })}
      </ul>
    </>
  );
}
