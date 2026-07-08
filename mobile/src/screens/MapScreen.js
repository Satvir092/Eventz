import React, { useEffect, useState, useCallback } from "react";
import { View, StyleSheet, TouchableOpacity, Text, ActivityIndicator, Alert } from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { useFocusEffect } from "@react-navigation/native";
 
import { fetchNearbyEvents } from "../api/client";
import { useSocket } from "../context/SocketContext";
import { COLORS, CATEGORY_META, categoryMeta } from "../theme";
 
export default function MapScreen({ navigation }) {
  const [region, setRegion] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const socket = useSocket();
 
  const loadNearby = useCallback(async (lat, lng) => {
    try {
      const results = await fetchNearbyEvents(lng, lat, 5);
      setEvents(results);
    } catch (err) {
      console.warn("Failed to load nearby events:", err.message);
    }
  }, []);
 
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Location needed", "Enable location access to see events near you.");
        setLoading(false);
        return;
      }
      const position = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = position.coords;
      setRegion({ latitude, longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 });
      await loadNearby(latitude, longitude);
      setLoading(false);
    })();
  }, [loadNearby]);
 
  // Sockets can miss messages if the phone briefly drops connection (common
  // on mobile networks), so rather than relying on push updates alone, we
  // also refetch every time this screen comes back into focus - e.g. right
  // after posting a new event and navigating back. This is what actually
  // guarantees a freshly created event shows up.
  useFocusEffect(
    useCallback(() => {
      if (region) loadNearby(region.latitude, region.longitude);
    }, [region, loadNearby])
  );
 
  useEffect(() => {
    if (!socket?.current) return;
    const s = socket.current;
 
    const onCreated = (event) => setEvents((prev) => [event, ...prev.filter((e) => e._id !== event._id)]);
    const onUpdated = (updated) =>
      setEvents((prev) => prev.map((e) => (e._id === updated._id ? updated : e)));
 
    s.on("event:created", onCreated);
    s.on("event:updated", onUpdated);
    return () => {
      s.off("event:created", onCreated);
      s.off("event:updated", onUpdated);
    };
  }, [socket]);
 
  async function handleRefresh() {
    if (!region || refreshing) return;
    setRefreshing(true);
    await loadNearby(region.latitude, region.longitude);
    setRefreshing(false);
  }
 
  if (loading || !region) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }
 
  return (
    <View style={styles.container}>
      <MapView style={StyleSheet.absoluteFill} initialRegion={region} showsUserLocation>
        {events.map((event) => {
          const meta = categoryMeta(event.category);
          return (
            <Marker
              key={event._id}
              coordinate={{
                latitude: event.location.coordinates[1],
                longitude: event.location.coordinates[0],
              }}
              title={`${meta.emoji} ${event.title}`}
              description={`${event.slotsOpen} spot(s) open`}
              onCalloutPress={() => navigation.navigate("EventDetail", { eventId: event._id })}
            >
              <View style={[styles.markerBubble, { backgroundColor: meta.color }]}>
                <Text style={styles.markerEmoji}>{meta.emoji}</Text>
              </View>
            </Marker>
          );
        })}
      </MapView>
 
      <TouchableOpacity style={styles.headerPill} onPress={handleRefresh} disabled={refreshing}>
        {refreshing ? (
          <ActivityIndicator size="small" color={COLORS.primary} />
        ) : (
          <Text style={styles.headerText}>
            {events.length} event{events.length === 1 ? "" : "s"} nearby · tap to refresh
          </Text>
        )}
      </TouchableOpacity>
 
      <View style={styles.legend}>
        {Object.entries(CATEGORY_META).map(([key, meta]) => (
          <View key={key} style={styles.legendRow}>
            <Text style={styles.legendEmoji}>{meta.emoji}</Text>
            <Text style={styles.legendLabel}>{meta.label}</Text>
          </View>
        ))}
      </View>
 
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("CreateEvent", { region })}
      >
        <Text style={styles.fabText}>+ Post event</Text>
      </TouchableOpacity>
    </View>
  );
}
 
const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.background },
  markerBubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "white",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  markerEmoji: { fontSize: 16 },
  headerPill: {
    position: "absolute",
    top: 20,
    left: 16,
    right: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  headerText: { fontSize: 13, fontWeight: "600", color: COLORS.textPrimary },
  legend: {
    position: "absolute",
    bottom: 100,
    left: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  legendRow: { flexDirection: "row", alignItems: "center", marginVertical: 2 },
  legendEmoji: { fontSize: 13, marginRight: 6 },
  legendLabel: { fontSize: 11, color: COLORS.textSecondary },
  fab: {
    position: "absolute",
    bottom: 32,
    alignSelf: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 26,
    borderRadius: 30,
    elevation: 4,
    shadowColor: COLORS.primaryDark,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  fabText: { color: "white", fontWeight: "700", fontSize: 16 },
});