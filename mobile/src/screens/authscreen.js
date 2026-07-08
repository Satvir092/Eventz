import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
 
import { login, register } from "../api/client";
import { COLORS } from "../theme";
 
export default function AuthScreen({ navigation }) {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
 
  async function handleSubmit() {
    if (!email.trim() || !password.trim() || (mode === "register" && !name.trim())) {
      Alert.alert("Missing info", "Fill in all fields.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "login") {
        await login(email.trim(), password);
      } else {
        await register(name.trim(), email.trim(), password);
      }
      navigation.replace("Map");
    } catch (err) {
      const message = err.response?.data?.error || err.message || "Something went wrong";
      Alert.alert(mode === "login" ? "Couldn't log in" : "Couldn't register", message);
    } finally {
      setBusy(false);
    }
  }
 
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Text style={styles.heading}>{mode === "login" ? "Log in" : "Create an account"}</Text>
 
      {mode === "register" && (
        <TextInput
          style={styles.input}
          placeholder="Name"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />
      )}
 
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
 
      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={busy}>
        <Text style={styles.buttonText}>
          {busy ? "Please wait..." : mode === "login" ? "Log in" : "Register"}
        </Text>
      </TouchableOpacity>
 
      <TouchableOpacity
        style={styles.switchModeButton}
        onPress={() => setMode(mode === "login" ? "register" : "login")}
      >
        <Text style={styles.switchModeText}>
          {mode === "login" ? "Need an account? Register" : "Already have an account? Log in"}
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}
 
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: COLORS.background },
  heading: { fontSize: 26, fontWeight: "800", marginBottom: 28, textAlign: "center", color: COLORS.textPrimary },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    marginBottom: 12,
    color: COLORS.textPrimary,
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
    shadowColor: COLORS.primaryDark,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  buttonText: { color: "white", fontWeight: "700", fontSize: 16 },
  switchModeButton: { marginTop: 16, alignItems: "center" },
  switchModeText: { color: COLORS.primary, fontWeight: "500" },
});