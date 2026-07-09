import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Point this at your machine's LAN IP when testing on a physical device,
// e.g. http://192.168.1.23:4000 - localhost won't resolve from a phone.
export const API_BASE_URL = "http://localhost:4000";

const client = axios.create({ baseURL: API_BASE_URL, timeout: 10000 });

client.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("authToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export async function login(email, password) {
  const { data } = await client.post("/api/auth/login", { email, password });
  await AsyncStorage.setItem("authToken", data.token);
  await AsyncStorage.setItem("userId", data.user.id);
  return data.user;
}

export async function register(name, email, password) {
  const { data } = await client.post("/api/auth/register", { name, email, password });
  await AsyncStorage.setItem("authToken", data.token);
  await AsyncStorage.setItem("userId", data.user.id);
  return data.user;
}

export async function fetchNearbyEvents(lng, lat, radiusMiles = 5) {
  const { data } = await client.get("/api/events/nearby", {
    params: { lng, lat, radiusMiles },
  });
  return data;
}

export async function fetchEvent(id) {
  const { data } = await client.get(`/api/events/${id}`);
  return data;
}

export async function createEvent(payload) {
  const { data } = await client.post("/api/events", payload);
  return data;
}

export async function joinEvent(id) {
  const { data } = await client.post(`/api/events/${id}/join`);
  return data;
}

export async function leaveEvent(id) {
  const { data } = await client.post(`/api/events/${id}/leave`);
  return data;
}

export async function reportUser(userId, reason, eventId) {
  const { data } = await client.post(`/api/users/${userId}/report`, { reason, eventId });
  return data;
}

export async function submitAttendance(eventId, noShowUserIds) {
  const { data } = await client.post(`/api/events/${eventId}/attendance`, { noShowUserIds });
  return data;
}

export default client;