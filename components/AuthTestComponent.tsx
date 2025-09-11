import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useAuth } from "@/contexts/AuthContext";
import React, { useState } from "react";
import { Alert, StyleSheet, TextInput, TouchableOpacity } from "react-native";

export function AuthTestComponent() {
  const [email, setEmail] = useState("test@farmer.com");
  const [password, setPassword] = useState("password123");
  const { user, signIn, signUp, signOut, loading } = useAuth();

  const handleSignUp = async () => {
    try {
      const result = await signUp({
        email,
        password,
        userData: {
          name: "Test Farmer",
          user_type: "farmer",
        },
      });
      if (result.error) {
        Alert.alert("Sign Up Error", result.error.message);
      } else {
        Alert.alert("Success", "Account created successfully!");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  const handleSignIn = async () => {
    try {
      const result = await signIn({ email, password });
      if (result.error) {
        Alert.alert("Sign In Error", result.error.message);
      } else {
        Alert.alert("Success", "Signed in successfully!");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      Alert.alert("Success", "Signed out successfully!");
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle">Auth Test</ThemedText>

      {user ? (
        <ThemedView>
          <ThemedText>✅ Logged in as: {user.email}</ThemedText>
          <ThemedText>User ID: {user.id}</ThemedText>
          <TouchableOpacity
            style={[styles.button, styles.signOutButton]}
            onPress={handleSignOut}
            disabled={loading}
          >
            <ThemedText style={styles.buttonText}>Sign Out</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      ) : (
        <ThemedView>
          <ThemedText>❌ Not logged in</ThemedText>

          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.button, styles.signInButton]}
            onPress={handleSignIn}
            disabled={loading}
          >
            <ThemedText style={styles.buttonText}>
              {loading ? "Loading..." : "Sign In"}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.signUpButton]}
            onPress={handleSignUp}
            disabled={loading}
          >
            <ThemedText style={styles.buttonText}>
              {loading ? "Loading..." : "Sign Up"}
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>
      )}
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
    backgroundColor: "#f9f9f9",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    backgroundColor: "white",
  },
  button: {
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
    alignItems: "center",
  },
  signInButton: {
    backgroundColor: "#2E7D32",
  },
  signUpButton: {
    backgroundColor: "#1976D2",
  },
  signOutButton: {
    backgroundColor: "#D32F2F",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
});
