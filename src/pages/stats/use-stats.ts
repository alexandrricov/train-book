import { useEffect, useMemo, useState } from "react";
import { subscribeItems, subscribeAllTargets } from "../../firebase-db";
import type { ExerciseType, SetRowDB, TargetRowDB, TargetsAsOf } from "../../types";
import { toDateString } from "../../utils/date";
import { EXERCISE_ORDER } from "../../exercises";
import { computeAllStats } from "./compute-stats";

function deriveTargetsAsOf(targets: TargetRowDB[], asOfDate: string): TargetsAsOf {
  const result: TargetsAsOf = {};
  for (const exType of EXERCISE_ORDER) {
    for (let i = targets.length - 1; i >= 0; i--) {
      if (targets[i].type === exType && targets[i].date <= asOfDate) {
        result[exType as ExerciseType] = {
          value: targets[i].value,
          date: targets[i].date,
        };
        break;
      }
    }
  }
  return result;
}

export function useStats() {
  const [items, setItems] = useState<SetRowDB[] | null>(null);
  const [rawTargets, setRawTargets] = useState<TargetRowDB[] | null>(null);

  useEffect(() => {
    const unsub = subscribeItems(setItems);
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = subscribeAllTargets(setRawTargets);
    return () => unsub();
  }, []);

  const loading = items === null || rawTargets === null;

  const stats = useMemo(() => {
    if (!items || !rawTargets) return null;
    return computeAllStats(items, rawTargets);
  }, [items, rawTargets]);

  const targetsAsOf = useMemo(() => {
    if (!rawTargets) return {};
    return deriveTargetsAsOf(rawTargets, toDateString());
  }, [rawTargets]);

  return { stats, items, targetsAsOf, loading };
}
