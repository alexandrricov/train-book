import { useCallback, useEffect, useState } from "react";

export type AddVariant = "A" | "B" | "C";

const LS_KEY = "trainbook:addVariant";
const DEFAULT_VARIANT: AddVariant = "A";

export const ADD_VARIANT_OPTIONS: {
  value: AddVariant;
  title: string;
  description: string;
}[] = [
  {
    value: "A",
    title: "Compact",
    description: "Segmented control + big stepper",
  },
  {
    value: "B",
    title: "Tiles",
    description: "One card per exercise with inline input",
  },
  {
    value: "C",
    title: "Hero",
    description: "Colored hero card with quick-add buttons",
  },
];

function isAddVariant(v: unknown): v is AddVariant {
  return v === "A" || v === "B" || v === "C";
}

function read(): AddVariant {
  if (typeof window === "undefined") return DEFAULT_VARIANT;
  const stored = window.localStorage.getItem(LS_KEY);
  return isAddVariant(stored) ? stored : DEFAULT_VARIANT;
}

export function useAddVariant(): [AddVariant, (v: AddVariant) => void] {
  const [variant, setVariantState] = useState<AddVariant>(read);

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === LS_KEY && isAddVariant(e.newValue)) {
        setVariantState(e.newValue);
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setVariant = useCallback((v: AddVariant) => {
    window.localStorage.setItem(LS_KEY, v);
    setVariantState(v);
  }, []);

  return [variant, setVariant];
}
