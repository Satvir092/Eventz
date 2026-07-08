import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
 
import { fetchEvent, joinEvent, leaveEvent } from "../api/client";
import { useSocket } from "../context/SocketContext";
import { COLORS, categoryMeta } from "../theme";
 
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
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }
 
  const isFull = event.slotsOpen === 0;
  const meta = categoryMeta(event.category);
 
  return (
    <View style={styles.container}>
      <View style={[styles.categoryBadge, { backgroundColor: meta.color }]}>
        <Text style={styles.categoryBadgeText}>
          {meta.emoji} {meta.label}
        </Text>
      </View>
 
      <Text style={styles.title}>{event.title}</Text>
      {!!event.description && <Text style={styles.description}>{event.description}</Text>}
 
      <View style={styles.slotsCard}>
        <Text style={styles.slotsNumber}>
          {event.slotsOpen} / {event.slotsTotal}
        </Text>
        <Text style={styles.slotsLabel}>spots open</Text>
      </View>
 
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
  container: { flex: 1, padding: 20, backgroundColor: COLORS.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.background },
  categoryBadge: {
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  categoryBadgeText: { color: "white", fontWeight: "700", fontSize: 12 },
  title: { fontSize: 24, fontWeight: "800", color: COLORS.textPrimary },
  description: { marginTop: 12, fontSize: 16, lineHeight: 22, color: COLORS.textSecondary },
  slotsCard: {
    marginTop: 24,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
  },
  slotsNumber: { fontSize: 28, fontWeight: "800", color: COLORS.primaryDark },
  slotsLabel: { fontSize: 13, color: COLORS.primaryDark, marginTop: 2 },
  button: {
    marginTop: 24,
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: COLORS.primaryDark,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  buttonDisabled: { backgroundColor: COLORS.textMuted, shadowOpacity: 0 },
  buttonText: { color: "white", fontWeight: "700", fontSize: 16 },
  leaveButton: { marginTop: 12, padding: 12, alignItems: "center" },
  leaveText: { color: COLORS.danger, fontWeight: "500" },
});