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
  container: { flex: 1, justifyContent: "center", padding: 24 },
  heading: { fontSize: 24, fontWeight: "700", marginBottom: 24, textAlign: "center" },
  input: {
    borderWidth: 1,
    borderColor: "#dee2e6",
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    marginBottom: 12,
  },
  button: {
    backgroundColor: "#1971c2",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: { color: "white", fontWeight: "700", fontSize: 16 },
  switchModeButton: { marginTop: 16, alignItems: "center" },
  switchModeText: { color: "#1971c2" },
});