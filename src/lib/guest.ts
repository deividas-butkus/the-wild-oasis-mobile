import type { User } from "@supabase/supabase-js";
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";

// The signed-in user's row in `guests`, matched by email (RLS only exposes your own row).
// Created on first sign-in, like the website's NextAuth signIn callback does.
export type Guest = {
  id: number;
  fullName: string;
  email: string;
  nationalID: string | null;
  nationality: string | null;
  countryFlag: string | null;
};

const columns = "id, fullName, email, nationalID, nationality, countryFlag";

async function getGuest(): Promise<Guest | null> {
  const { data, error } = await supabase.from("guests").select(columns).maybeSingle();
  if (error) throw new Error("Your profile could not be loaded");
  return data;
}

async function getOrCreateGuest(user: User): Promise<Guest> {
  const existing = await getGuest();
  if (existing) return existing;

  const meta = user.user_metadata;
  const { data: created, error } = await supabase
    .from("guests")
    .insert({ email: user.email, fullName: meta.full_name ?? meta.name ?? user.email })
    .select(columns)
    .single();

  // 23505 = unique violation: created meanwhile (e.g. by a second request), so read it again
  const guest = error?.code === "23505" ? await getGuest() : created;
  if (!guest) throw new Error("Your profile could not be created");
  return guest;
}

export function useGuest(user: User | undefined) {
  return useQuery({
    queryKey: ["guest", user?.id],
    queryFn: () => getOrCreateGuest(user!),
    enabled: !!user,
  });
}
