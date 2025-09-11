/**
 * Database Debug Component
 * Tests database connectivity and shows detailed error information
 */

import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../lib/supabase/client";

interface TestResult {
  name: string;
  success: boolean;
  error?: any;
  data?: any;
  details?: string;
}

export const DatabaseDebugComponent: React.FC = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [testing, setTesting] = useState(false);

  const runDatabaseTests = async () => {
    setTesting(true);
    const testResults: TestResult[] = [];

    // Test 1: Authentication status
    try {
      const { data: authData, error: authError } =
        await supabase.auth.getSession();
      testResults.push({
        name: "Authentication Status",
        success: !authError,
        error: authError,
        data: authData.session?.user
          ? {
              userId: authData.session.user.id,
              email: authData.session.user.email,
              confirmed: authData.session.user.email_confirmed_at !== null,
            }
          : null,
        details: authData.session ? "User authenticated" : "No active session",
      });
    } catch (error) {
      testResults.push({
        name: "Authentication Status",
        success: false,
        error,
        details: "Failed to check auth status",
      });
    }

    // Test 2: Basic table access without filters
    const tables = ["profiles", "product_listings", "orders", "messages"];

    for (const table of tables) {
      try {
        const { data, error, count } = await supabase
          .from(table)
          .select("*", { count: "exact" })
          .limit(1);

        testResults.push({
          name: `Table: ${table}`,
          success: !error,
          error: error
            ? {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code,
              }
            : null,
          data: { recordCount: count, sampleRecord: data?.[0] },
          details: error
            ? `Failed to access ${table}`
            : `Successfully accessed ${table}`,
        });
      } catch (error) {
        testResults.push({
          name: `Table: ${table}`,
          success: false,
          error: {
            message: (error as any)?.message || "Unknown error",
            details: String(error),
          },
          details: `Exception accessing ${table}`,
        });
      }
    }

    // Test 3: RLS policy test with authenticated user (if available)
    try {
      const { data: authData } = await supabase.auth.getSession();
      if (authData.session?.user?.id) {
        const userId = authData.session.user.id;

        // Test product_listings with user filter
        const { data, error } = await supabase
          .from("product_listings")
          .select("*")
          .eq("farmer_id", userId)
          .limit(5);

        testResults.push({
          name: "User-filtered product_listings",
          success: !error,
          error: error
            ? {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code,
              }
            : null,
          data: { recordCount: data?.length || 0, records: data },
          details: error
            ? "RLS policy may be blocking access"
            : "User filter query successful",
        });

        // Test messages with user filter
        const { data: messagesData, error: messagesError } = await supabase
          .from("messages")
          .select("*")
          .eq("receiver_id", userId)
          .limit(5);

        testResults.push({
          name: "User-filtered messages",
          success: !messagesError,
          error: messagesError
            ? {
                message: messagesError.message,
                details: messagesError.details,
                hint: messagesError.hint,
                code: messagesError.code,
              }
            : null,
          data: {
            recordCount: messagesData?.length || 0,
            records: messagesData,
          },
          details: messagesError
            ? "RLS policy may be blocking access"
            : "User filter query successful",
        });
      }
    } catch (error) {
      testResults.push({
        name: "RLS Policy Test",
        success: false,
        error,
        details: "Failed to test RLS policies",
      });
    }

    setResults(testResults);
    setTesting(false);
  };

  const renderResult = (result: TestResult, index: number) => (
    <View
      key={index}
      style={[
        styles.resultContainer,
        result.success ? styles.success : styles.error,
      ]}
    >
      <Text style={styles.testName}>{result.name}</Text>
      <Text
        style={[
          styles.status,
          result.success ? styles.successText : styles.errorText,
        ]}
      >
        {result.success ? "✅ SUCCESS" : "❌ FAILED"}
      </Text>

      {result.details && <Text style={styles.details}>{result.details}</Text>}

      {result.error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Error Details:</Text>
          <Text style={styles.errorText}>
            {JSON.stringify(result.error, null, 2)}
          </Text>
        </View>
      )}

      {result.data && (
        <View style={styles.dataContainer}>
          <Text style={styles.dataTitle}>Data:</Text>
          <Text style={styles.dataText}>
            {JSON.stringify(result.data, null, 2)}
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Database Connectivity Test</Text>

      <TouchableOpacity
        style={[styles.button, testing && styles.buttonDisabled]}
        onPress={runDatabaseTests}
        disabled={testing}
      >
        <Text style={styles.buttonText}>
          {testing ? "Running Tests..." : "Run Database Tests"}
        </Text>
      </TouchableOpacity>

      {results.length > 0 && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>Test Results:</Text>
          {results.map((result, index) => renderResult(result, index))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#007bff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  buttonDisabled: {
    backgroundColor: "#6c757d",
  },
  buttonText: {
    color: "white",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "bold",
  },
  resultsContainer: {
    marginTop: 20,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  resultContainer: {
    padding: 12,
    marginBottom: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  success: {
    backgroundColor: "#d4edda",
    borderColor: "#c3e6cb",
  },
  error: {
    backgroundColor: "#f8d7da",
    borderColor: "#f5c6cb",
  },
  testName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  status: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
  },
  successText: {
    color: "#155724",
  },
  errorText: {
    color: "#721c24",
  },
  details: {
    fontSize: 14,
    marginBottom: 8,
    fontStyle: "italic",
  },
  errorContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: "#fff3cd",
    borderRadius: 4,
  },
  errorTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 4,
  },
  dataContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: "#e2e3e5",
    borderRadius: 4,
  },
  dataTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 4,
  },
  dataText: {
    fontSize: 10,
    fontFamily: "monospace",
  },
});

export default DatabaseDebugComponent;
