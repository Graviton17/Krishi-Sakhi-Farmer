import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { supabase } from "@/lib/supabase/client";
import React, { useEffect, useState } from "react";
import { StyleSheet } from "react-native";

export function DatabaseTest() {
  const [status, setStatus] = useState<string>("Testing...");
  const [details, setDetails] = useState<string>("");

  useEffect(() => {
    testDatabaseConnection();
  }, []);

  const testDatabaseConnection = async () => {
    try {
      // Test 1: Basic connection
      setStatus("Testing basic connection...");
      const { error } = await supabase
        .from("profiles")
        .select("count")
        .limit(1);

      if (error) {
        setStatus("❌ Connection failed");
        setDetails(
          `Error: ${error.message}\nCode: ${error.code}\nDetails: ${error.details}`
        );
        return;
      }

      // Test 2: Check if user is authenticated
      setStatus("✅ Connection OK. Checking auth...");
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        setStatus("❌ Auth check failed");
        setDetails(`Auth Error: ${authError.message}`);
        return;
      }

      if (!user) {
        setStatus("⚠️ No authenticated user");
        setDetails("Database connection works but no user is logged in");
        return;
      }

      setStatus("✅ All tests passed");
      setDetails(`User ID: ${user.id}\nEmail: ${user.email}`);
    } catch (error: any) {
      setStatus("❌ Exception occurred");
      setDetails(`Exception: ${error.message || error.toString()}`);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle">Database Test</ThemedText>
      <ThemedText style={styles.status}>{status}</ThemedText>
      {details && <ThemedText style={styles.details}>{details}</ThemedText>}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    margin: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  status: {
    marginVertical: 8,
    fontSize: 16,
    fontWeight: "bold",
  },
  details: {
    marginTop: 8,
    fontSize: 12,
    opacity: 0.7,
  },
});
