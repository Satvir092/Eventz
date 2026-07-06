import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from "react-native";

import { fetchEvent, joinEvent, leaveEvent } from "../api/client";
import { useSocket } from "../context/SocketContext";

export default function EventDetailScreen({ route }) {
  const { eventId } = route.params;
  const [event, setEvent] = useState(null);
  const [busy, setBusy] = useState(false);
  const socket = useSocket();

  const load = useCallback(async () => {
    try {
      const data = await fetchEvent(eventId);
      setEvent(data);
    } catch (err) {
      Alert.alert("Error", "Couldn't load this event.");
    }
  }, [eventId]);

  useEffect(() => {
    load();
  }, [load]);

  // Subscribe to just this event's room so slot-count changes made by
  // other users show up live without polling.
  useEffect(() => {
    if (!socket?.current) return;
    const s = socket.current;
    s.emit("event:subscribe", eventId);

    const onUpdated = (updated) => {
      if (updated._id === eventId) setEvent(updated);
    };
    s.on("event:updated", onUpdated);

    return () => {
      s.emit("event:unsubscribe", eventId);
      s.off("event:updated", onUpdated);
    };
  }, [socket, eventId]);

  async function handleJoin() {
    setBusy(true);
    try {
      const updated = await joinEvent(eventId);
      setEvent(updated);
    } catch (err) {
      Alert.alert("Couldn't join", err.response?.data?.error || err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleLeave() {
    setBusy(true);
    try {
      const updated = await leaveEvent(eventId);
      setEvent(updated);
    } catch (err) {
      Alert.alert("Couldn't leave", err.message);
    } finally {
      setBusy(false);
    }
  }

  if (!event) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const isFull = event.slotsOpen === 0;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{event.title}</Text>
      <Text style={styles.category}>{event.category}</Text>
      {!!event.description && <Text style={styles.description}>{event.description}</Text>}

      <Text style={styles.slots}>
        {event.slotsOpen} of {event.slotsTotal} spot(s) open
      </Text>

      <TouchableOpacity
        style={[styles.button, isFull && styles.buttonDisabled]}
        onPress={handleJoin}
        disabled={busy || isFull}
      >
        <Text style={styles.buttonText}>{isFull ? "Full" : busy ? "Joining..." : "Join"}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.leaveButton} onPress={handleLeave} disabled={busy}>
        <Text style={styles.leaveText}>Leave event</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 22, fontWeight: "700" },
  category: { color: "#868e96", marginTop: 4, textTransform: "capitalize" },
  description: { marginTop: 12, fontSize: 16, lineHeight: 22 },
  slots: { marginTop: 20, fontSize: 16, fontWeight: "600" },
  button: {
    marginTop: 24,
    backgroundColor: "#1971c2",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonDisabled: { backgroundColor: "#adb5bd" },
  buttonText: { color: "white", fontWeight: "700", fontSize: 16 },
  leaveButton: { marginTop: 12, padding: 12, alignItems: "center" },
  leaveText: { color: "#e03131" },
});
