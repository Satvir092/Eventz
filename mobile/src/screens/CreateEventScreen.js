import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";

import { createEvent } from "../api/client";

const CATEGORIES = ["sports", "party", "study", "music", "other"];

export default function CreateEventScreen({ route, navigation }) {
  const { region } = route.params;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("sports");
  const [slotsTotal, setSlotsTotal] = useState("4");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!title.trim()) {
      Alert.alert("Missing title", "Give your event a short title.");
      return;
    }
    setSubmitting(true);
    try {
      // MVP: uses the map's current center as the event location.
      // Next iteration: let the user drag a pin to pick an exact spot.
      await createEvent({
        title,
        description,
        category,
        lng: region.longitude,
        lat: region.latitude,
        startTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // defaults to 1hr from now
        slotsTotal: Number(slotsTotal) || 1,
      });
      navigation.goBack();
    } catch (err) {
      Alert.alert("Couldn't create event", err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.label}>What's happening?</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. 3v3 pickup basketball"
        value={title}
        onChangeText={setTitle}
      />

      <Text style={styles.label}>Details</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        placeholder="Any details people should know"
        value={description}
        onChangeText={setDescription}
        multiline
      />

      <Text style={styles.label}>Category</Text>
      <View style={styles.categoryRow}>
        {CATEGORIES.map((c) => (
          <TouchableOpacity
            key={c}
            style={[styles.chip, category === c && styles.chipSelected]}
            onPress={() => setCategory(c)}
          >
            <Text style={category === c ? styles.chipTextSelected : styles.chipText}>{c}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>How many people total (including you)?</Text>
      <TextInput
        style={styles.input}
        keyboardType="number-pad"
        value={slotsTotal}
        onChangeText={setSlotsTotal}
      />

      <TouchableOpacity
        style={styles.submitButton}
        onPress={handleSubmit}
        disabled={submitting}
      >
        <Text style={styles.submitText}>{submitting ? "Posting..." : "Post Event"}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  label: { fontWeight: "600", marginTop: 16, marginBottom: 6, fontSize: 14 },
  input: {
    borderWidth: 1,
    borderColor: "#dee2e6",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  multiline: { height: 80, textAlignVertical: "top" },
  categoryRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#dee2e6",
    marginRight: 8,
    marginBottom: 8,
  },
  chipSelected: { backgroundColor: "#1971c2", borderColor: "#1971c2" },
  chipText: { color: "#495057" },
  chipTextSelected: { color: "white", fontWeight: "600" },
  submitButton: {
    marginTop: 28,
    backgroundColor: "#1971c2",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  submitText: { color: "white", fontWeight: "700", fontSize: 16 },
});
