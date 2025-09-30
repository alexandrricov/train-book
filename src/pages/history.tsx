import { useEffect, useMemo, useState } from "react";
import { type ExerciseType, type SetRow } from "../types";
import { deleteMyItem, subscribeMyItems } from "../firebase-db";
import { EXERCISE, EXERCISE_ORDER } from "../exercises";
import { AddSection } from "../sections/add-section";
import { Icon } from "../components/icon";
import { Button } from "../components/action";

export function History() {
  const [items, setItems] = useState<SetRow[]>([]);

  useEffect(() => {
    const unsubItems = subscribeMyItems(setItems);

    return () => {
      unsubItems();
    };
  }, []);

  const groupedItems = useMemo(() => {
    return items.reduce((acc, item) => {
      if (!acc[item.date])
        acc[item.date] = {} as Record<ExerciseType, SetRow[]>;
      if (!acc[item.date][item.type]) acc[item.date][item.type] = [];
      acc[item.date][item.type].push(item);
      return acc;
    }, {} as Record<string, Record<ExerciseType, SetRow[]>>);
  }, [items]);

  const itemsGroupedByDate = useMemo(() => {
    return items.reduce((acc, item) => {
      if (!acc[item.date]) acc[item.date] = [] as SetRow[];
      acc[item.date].push(item);
      return acc;
    }, {} as Record<string, SetRow[]>);
  }, [items]);

  // every day from today to smallest date
  const days = useMemo(() => {
    // if (items.length === 0) return [];
    // const dateStrings = Object.keys(groupedItems);
    // const minDate = dateStrings.reduce(
    //   (min, d) => (d < min ? d : min),
    //   dateStrings[0]
    // );
    // const today = new Date();
    // const min = new Date(minDate);
    // const result: string[] = [];
    // for (let d = new Date(today); d >= min; d.setDate(d.getDate() - 1)) {
    //   const iso = d.toISOString().slice(0, 10);
    //   result.push(iso);
    // }
    // return result;

    return Object.keys(groupedItems).sort((a, b) => (a > b ? -1 : 1));
  }, [groupedItems]);

  // console.log({ items, groupedItems, days, itemsGroupedByDate });

  if (items.length === 0) return <div>No items yet</div>;

  return (
    <>
      <h1 className="text-h1 mb-4">History</h1>

      <AddSection />

      <section>
        <h2 className="text-h2 mb-4">History log</h2>
        {days.length === 0 && <div>No items yet</div>}
        <ul>
          {days.map((d) => (
            <li key={d} className="mb-6">
              <details className="open:[&>summary>svg]:rotate-180">
                <summary className="cursor-pointer mb-2 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <h3 className="text-h3">{d}</h3>
                    <div className="flex">
                      {Object.entries(groupedItems[d])
                        .sort(([a], [b]) => {
                          const orderA = EXERCISE_ORDER.indexOf(
                            a as ExerciseType
                          );
                          const orderB = EXERCISE_ORDER.indexOf(
                            b as ExerciseType
                          );
                          return orderA - orderB;
                        })
                        .map(([type, counts]) => (
                          <div
                            key={type}
                            className="flex items-center gap-1 ml-2"
                          >
                            <Icon
                              name={type as ExerciseType}
                              className="size-5"
                              style={{
                                color: EXERCISE[type as ExerciseType]?.color,
                              }}
                            />
                            {counts.reduce((acc, b) => acc + b.count, 0)}
                          </div>
                        ))}
                    </div>
                  </div>
                  <Icon name="chevron-down" />
                </summary>
                <div className="mt-2">
                  <table className="w-full table-auto border-collapse">
                    <thead>
                      <tr className="text-left">
                        <th className="pb-1">Exercise</th>
                        <th className="pb-1">Count</th>
                        <th className="pb-1 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {itemsGroupedByDate[d].map((row) => (
                        <tr key={row.id} className="border-t border-border">
                          <td className="py-1">
                            <div className="flex items-center gap-2">
                              <Icon
                                name={row.type as ExerciseType}
                                className="size-5"
                                style={{
                                  color:
                                    EXERCISE[row.type as ExerciseType]?.color,
                                }}
                              />
                              {EXERCISE[row.type as ExerciseType]?.label ||
                                row.type ||
                                "Unknown"}
                            </div>
                          </td>
                          <td className="py-1">{row.count}</td>
                          <td className="py-1 font-semibold">
                            <Button
                              variation="secondary"
                              size="small"
                              className="ml-auto"
                              onClick={() => {
                                if (window.confirm("Are you sure?")) {
                                  deleteMyItem(row.id);
                                }
                              }}
                            >
                              Delete
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>

              {/* <h3 className="text-h3 font-semibold mb-2">{d}</h3>
              {groupedItems[d] ? (
                <dl className="list-disc pl-5">
                  {Object.entries(groupedItems[d])
                    .sort(([a], [b]) => {
                      const orderA = EXERCISE_ORDER.indexOf(a as ExerciseType);
                      const orderB = EXERCISE_ORDER.indexOf(b as ExerciseType);
                      return orderA - orderB;
                    })
                    .map(([type, counts]) => (
                      <div key={type} className="flex gap-2 justify-between">
                        <dt>{EXERCISE[type as ExerciseType].label ?? type}</dt>
                        <dd>
                          {counts.map((c) => c.count).join(", ")} ={" "}
                          {counts.reduce((acc, b) => acc + b.count, 0)}
                        </dd>
                      </div>
                    ))}
                </dl>
              ) : (
                <div>No exercises logged</div>
              )} */}
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
