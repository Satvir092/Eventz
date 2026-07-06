import React, { useEffect, useState, useCallback } from "react";
import { View, StyleSheet, TouchableOpacity, Text, ActivityIndicator, Alert } from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";

import { fetchNearbyEvents } from "../api/client";
import { useSocket } from "../context/SocketContext";

const CATEGORY_COLORS = {
  sports: "#2f9e44",
  party: "#e8590c",
  study: "#1971c2",
  music: "#9c36b5",
  other: "#495057",
};

export default function MapScreen({ navigation }) {
  const [region, setRegion] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const socket = useSocket();

  const loadNearby = useCallback(async (lat, lng) => {
    try {
      const results = await fetchNearbyEvents(lng, lat, 5);
      setEvents(results);
    } catch (err) {
      console.warn("Failed to load nearby events:", err.message);
    } finally {
      setLoading(false);
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
      loadNearby(latitude, longitude);
    })();
  }, [loadNearby]);

  // Listen for live event creation/updates from other users
  useEffect(() => {
    if (!socket?.current) return;
    const s = socket.current;

    const onCreated = (event) => setEvents((prev) => [event, ...prev]);
    const onUpdated = (updated) =>
      setEvents((prev) => prev.map((e) => (e._id === updated._id ? updated : e)));

    s.on("event:created", onCreated);
    s.on("event:updated", onUpdated);
    return () => {
      s.off("event:created", onCreated);
      s.off("event:updated", onUpdated);
    };
  }, [socket]);

  if (loading || !region) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView style={StyleSheet.absoluteFill} initialRegion={region} showsUserLocation>
        {events.map((event) => (
          <Marker
            key={event._id}
            coordinate={{
              latitude: event.location.coordinates[1],
              longitude: event.location.coordinates[0],
            }}
            pinColor={CATEGORY_COLORS[event.category] || CATEGORY_COLORS.other}
            title={event.title}
            description={`${event.slotsOpen} spot(s) open`}
            onCalloutPress={() => navigation.navigate("EventDetail", { eventId: event._id })}
          />
        ))}
      </MapView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("CreateEvent", { region })}
      >
        <Text style={styles.fabText}>+ Post</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  fab: {
    position: "absolute",
    bottom: 32,
    alignSelf: "center",
    backgroundColor: "#1971c2",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 30,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  fabText: { color: "white", fontWeight: "600", fontSize: 16 },
});
