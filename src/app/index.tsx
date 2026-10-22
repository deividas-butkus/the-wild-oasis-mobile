import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors } from "@/constants/colors";
import { supabase } from "@/lib/supabase";

type Status = { ok: boolean; message: string } | null;

// Placeholder home screen: confirms the Supabase key and RLS read access work.
// Replaced by the cabin list in Phase 1 (docs/PLAN.md).
export default function Index() {
  const [status, setStatus] = useState<Status>(null);

  useEffect(() => {
    supabase
      .from("cabins")
      .select("id", { count: "exact", head: true })
      .then(({ count, error }) =>
        setStatus(
          error
            ? { ok: false, message: error.message }
            : { ok: true, message: `Connected: ${count ?? 0} cabins visible` },
        ),
      );
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>The Wild Oasis</Text>
      <Text style={styles.subtitle}>Mobile app — work in progress</Text>
      <Text style={[styles.status, { color: status?.ok ? colors.accent[400] : colors.primary[300] }]}>
        {status ? status.message : "Checking Supabase connection…"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "600",
    color: colors.accent[400],
  },
  subtitle: {
    fontSize: 16,
    color: colors.primary[200],
  },
  status: {
    marginTop: 24,
    fontSize: 14,
    textAlign: "center",
  },
});
