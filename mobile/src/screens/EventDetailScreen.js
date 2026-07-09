import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { fetchEvent, joinEvent, leaveEvent, reportUser, submitAttendance } from "../api/client";
import { useSocket } from "../context/SocketContext";
import { COLORS, categoryMeta } from "../theme";

export default function EventDetailScreen({ route }) {
  const { eventId } = route.params;
  const [event, setEvent] = useState(null);
  const [myUserId, setMyUserId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [noShowIds, setNoShowIds] = useState(new Set());
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
    AsyncStorage.getItem("userId").then(setMyUserId);
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
      setEvent(await joinEvent(eventId));
    } catch (err) {
      Alert.alert("Couldn't join", err.response?.data?.error || err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleLeave() {
    setBusy(true);
    try {
      setEvent(await leaveEvent(eventId));
    } catch (err) {
      Alert.alert("Couldn't leave", err.message);
    } finally {
      setBusy(false);
    }
  }

  function handleReport(participantUserId, participantName) {
    Alert.alert(`Report ${participantName}?`, "What's the issue?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "No-show / didn't show up",
        onPress: () => submitReport(participantUserId, "no-show"),
      },
      {
        text: "Inappropriate behavior",
        onPress: () => submitReport(participantUserId, "inappropriate behavior"),
      },
    ]);
  }

  async function submitReport(participantUserId, reason) {
    try {
      await reportUser(participantUserId, reason, eventId);
      Alert.alert("Thanks", "Your report has been submitted.");
    } catch (err) {
      Alert.alert("Couldn't submit report", err.response?.data?.error || err.message);
    }
  }

  function toggleNoShow(userId) {
    setNoShowIds((prev) => {
      const next = new Set(prev);
      next.has(userId) ? next.delete(userId) : next.add(userId);
      return next;
    });
  }

  async function handleSubmitAttendance() {
    try {
      await submitAttendance(eventId, Array.from(noShowIds));
      Alert.alert("Saved", "Attendance recorded.");
    } catch (err) {
      Alert.alert("Couldn't save attendance", err.response?.data?.error || err.message);
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
  const isHost = myUserId && String(event.host?._id || event.host) === myUserId;
  const eventStarted = new Date(event.startTime) <= new Date();

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
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

      {!isHost && (
        <>
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
        </>
      )}

      <Text style={styles.sectionLabel}>Who's going</Text>
      {event.participants.map((p) => {
        const uid = p.user?._id || p.user;
        const name = p.user?.name || "Someone";
        const isSelf = myUserId && String(uid) === myUserId;
        return (
          <View key={String(uid)} style={styles.participantRow}>
            <Text style={styles.participantName}>
              {name} {isSelf ? "(you)" : ""}
            </Text>
            {isHost && eventStarted ? (
              <TouchableOpacity onPress={() => toggleNoShow(String(uid))}>
                <Text style={noShowIds.has(String(uid)) ? styles.noShowActive : styles.noShowLabel}>
                  {noShowIds.has(String(uid)) ? "Marked no-show" : "Mark no-show"}
                </Text>
              </TouchableOpacity>
            ) : (
              !isSelf && (
                <TouchableOpacity onPress={() => handleReport(uid, name)}>
                  <Text style={styles.reportLink}>Report</Text>
                </TouchableOpacity>
              )
            )}
          </View>
        );
      })}

      {isHost && eventStarted && (
        <TouchableOpacity style={styles.attendanceButton} onPress={handleSubmitAttendance}>
          <Text style={styles.buttonText}>Save attendance</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
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
  },
  buttonDisabled: { backgroundColor: COLORS.textMuted },
  buttonText: { color: "white", fontWeight: "700", fontSize: 16 },
  leaveButton: { marginTop: 12, padding: 12, alignItems: "center" },
  leaveText: { color: COLORS.danger, fontWeight: "500" },
  sectionLabel: {
    marginTop: 28,
    marginBottom: 8,
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  participantRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  participantName: { fontSize: 15, color: COLORS.textPrimary },
  reportLink: { color: COLORS.danger, fontSize: 13 },
  noShowLabel: { color: COLORS.textSecondary, fontSize: 13 },
  noShowActive: { color: COLORS.danger, fontSize: 13, fontWeight: "700" },
  attendanceButton: {
    marginTop: 24,
    backgroundColor: COLORS.primaryDark,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
});