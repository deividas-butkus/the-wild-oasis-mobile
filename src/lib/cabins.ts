import { useQuery } from "@tanstack/react-query";

import { NotFoundError } from "@/lib/errors";
import { supabase } from "@/lib/supabase";

// Readable without signing in (RLS "Everyone: read cabins", docs/sql/01-rls-admins-and-guests.sql)
export type Cabin = {
  id: number;
  name: string;
  maxCapacity: number;
  regularPrice: number;
  discount: number;
  image: string;
  description: string;
};

export type CabinSummary = Omit<Cabin, "description">;

// Same groups as the website's capacity filter
export const capacityFilters = [
  { key: "all", label: "All cabins", matches: () => true },
  { key: "small", label: "1–3 guests", matches: (c: CabinSummary) => c.maxCapacity <= 3 },
  {
    key: "medium",
    label: "4–7 guests",
    matches: (c: CabinSummary) => c.maxCapacity >= 4 && c.maxCapacity <= 7,
  },
  { key: "large", label: "8–12 guests", matches: (c: CabinSummary) => c.maxCapacity >= 8 },
] as const;

export type CapacityFilter = (typeof capacityFilters)[number]["key"];

async function getCabins(): Promise<CabinSummary[]> {
  const { data, error } = await supabase
    .from("cabins")
    .select("id, name, maxCapacity, regularPrice, discount, image")
    .order("name");

  if (error) throw new Error("Cabins could not be loaded");
  return data.map((cabin) => ({ ...cabin, discount: cabin.discount ?? 0 }));
}

async function getCabin(id: number): Promise<Cabin> {
  if (!Number.isInteger(id)) throw new NotFoundError("Cabin not found");

  const { data, error } = await supabase.from("cabins").select("*").eq("id", id).maybeSingle();

  if (error) throw new Error("Cabin could not be loaded");
  if (!data) throw new NotFoundError("Cabin not found");
  return { ...data, discount: data.discount ?? 0 };
}

export function useCabins() {
  return useQuery({ queryKey: ["cabins"], queryFn: getCabins });
}

export function useCabin(id: number) {
  return useQuery({ queryKey: ["cabins", id], queryFn: () => getCabin(id) });
}
