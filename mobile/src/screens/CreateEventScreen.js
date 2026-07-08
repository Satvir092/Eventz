import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import MapView from "react-native-maps";
 
import { createEvent } from "../api/client";
import { COLORS, CATEGORY_META } from "../theme";
 
export default function CreateEventScreen({ route, navigation }) {
  const { region } = route.params;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("sports");
  const [slotsTotal, setSlotsTotal] = useState("4");
  const [submitting, setSubmitting] = useState(false);
 
  // Fixed-center-pin pattern: instead of dragging a tiny marker (fiddly on
  // a touchscreen), the pin stays fixed in the middle of the screen and the
  // user drags/pans the *map* underneath it - much bigger, easier target.
  const [pinCoords, setPinCoords] = useState({
    latitude: region.latitude,
    longitude: region.longitude,
  });
  const mapRef = useRef(null);
 
  function handleRegionChangeComplete(newRegion) {
    setPinCoords({ latitude: newRegion.latitude, longitude: newRegion.longitude });
  }
 
  function resetToCurrentLocation() {
    mapRef.current?.animateToRegion(
      { ...region, latitudeDelta: 0.02, longitudeDelta: 0.02 },
      300
    );
    setPinCoords({ latitude: region.latitude, longitude: region.longitude });
  }
 
  async function handleSubmit() {
    if (!title.trim()) {
      Alert.alert("Missing title", "Give your event a short title.");
      return;
    }
    setSubmitting(true);
    try {
      await createEvent({
        title,
        description,
        category,
        lng: pinCoords.longitude,
        lat: pinCoords.latitude,
        startTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        slotsTotal: Number(slotsTotal) || 1,
      });
      navigation.goBack();
    } catch (err) {
      Alert.alert("Couldn't create event", err.message);
    } finally {
      setSubmitting(false);
    }
  }
 
  const activeMeta = CATEGORY_META[category];
 
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Text style={styles.label}>What's happening?</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. 3v3 pickup basketball"
        placeholderTextColor={COLORS.textMuted}
        value={title}
        onChangeText={setTitle}
      />
 
      <Text style={styles.label}>Details</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        placeholder="Any details people should know"
        placeholderTextColor={COLORS.textMuted}
        value={description}
        onChangeText={setDescription}
        multiline
      />
 
      <Text style={styles.label}>Category</Text>
      <View style={styles.categoryRow}>
        {Object.entries(CATEGORY_META).map(([key, meta]) => {
          const selected = category === key;
          return (
            <TouchableOpacity
              key={key}
              style={[
                styles.chip,
                selected && { backgroundColor: meta.color, borderColor: meta.color },
              ]}
              onPress={() => setCategory(key)}
            >
              <Text style={styles.chipEmoji}>{meta.emoji}</Text>
              <Text style={selected ? styles.chipTextSelected : styles.chipText}>
                {meta.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
 
      <View style={styles.locationHeader}>
        <Text style={styles.label}>Where's it happening?</Text>
        <TouchableOpacity onPress={resetToCurrentLocation}>
          <Text style={styles.resetLink}>Use my location</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.hint}>Drag the map so the pin sits where you want</Text>
 
      <View style={styles.mapWrapper}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={{
            latitude: region.latitude,
            longitude: region.longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }}
          onRegionChangeComplete={handleRegionChangeComplete}
        />
        {/* Fixed pin overlay - always centered, doesn't move with touches */}
        <View pointerEvents="none" style={styles.fixedPinWrapper}>
          <View style={[styles.pinBubble, { backgroundColor: activeMeta.color }]}>
            <Text style={styles.pinEmoji}>{activeMeta.emoji}</Text>
          </View>
          <View style={[styles.pinStem, { backgroundColor: activeMeta.color }]} />
        </View>
      </View>
 
      <Text style={styles.label}>How many people total (including you)?</Text>
      <TextInput
        style={styles.input}
        keyboardType="number-pad"
        value={slotsTotal}
        onChangeText={setSlotsTotal}
      />
 
      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={submitting}>
        <Text style={styles.submitText}>{submitting ? "Posting..." : "Post Event"}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
 
const styles = StyleSheet.create({
  screen: { backgroundColor: COLORS.background },
  container: { padding: 20, paddingBottom: 40 },
  label: { fontWeight: "700", marginTop: 18, marginBottom: 6, fontSize: 14, color: COLORS.textPrimary },
  hint: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  multiline: { height: 80, textAlignVertical: "top" },
  categoryRow: { flexDirection: "row", flexWrap: "wrap" },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    marginRight: 8,
    marginBottom: 8,
  },
  chipEmoji: { fontSize: 14, marginRight: 5 },
  chipText: { color: COLORS.textSecondary, fontWeight: "500" },
  chipTextSelected: { color: "white", fontWeight: "700" },
  locationHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  resetLink: { color: COLORS.primary, fontWeight: "600", fontSize: 13, marginTop: 18 },
  mapWrapper: {
    height: 240,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  map: { flex: 1 },
  fixedPinWrapper: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -18,
    marginTop: -46, // lifts the pin so its tip (not center) points at the map center
    alignItems: "center",
  },
  pinBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "white",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  pinEmoji: { fontSize: 17 },
  pinStem: { width: 3, height: 12, marginTop: -2, borderRadius: 2 },
  submitButton: {
    marginTop: 28,
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: COLORS.primaryDark,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  submitText: { color: "white", fontWeight: "700", fontSize: 16 },
});
 