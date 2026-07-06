# Nearby Events

Post and find nearby happenings that need more people — pickup basketball, a party, a study group — on a live map. Built to showcase geospatial search, real-time updates, and mobile development.

## Stack
- **Mobile:** React Native (Expo), React Navigation, react-native-maps
- **Backend:** Node/Express, MongoDB (2dsphere geospatial index), Socket.io
- **Auth:** JWT

## Project structure
```
nearby-events/
  server/     Express API + MongoDB + Socket.io
  mobile/     Expo React Native app
```

## Getting started

### 1. Backend
```bash
cd server
npm install
cp .env.example .env    # fill in MONGO_URI and JWT_SECRET
npm run dev
```
Requires a local or hosted MongoDB instance (MongoDB Atlas free tier works fine).

### 2. Mobile app
```bash
cd mobile
npm install
npx expo install react-native-maps expo-location   # ensures native deps match your Expo SDK
npm start
```
Scan the QR code with Expo Go on your phone, or press `i`/`a` for iOS/Android simulator.

**Important:** in `mobile/src/api/client.js`, update `API_BASE_URL` to your computer's LAN IP (e.g. `http://192.168.1.23:4000`) — `localhost` won't resolve from a physical device.

## What's implemented (MVP)
- Register/login (JWT)
- Post an event with title, category, slot count, and location (defaults to map center)
- View nearby events on a map, color-coded by category
- Join/leave an event with **atomic slot handling** — prevents two users from both grabbing the "last spot" in a race condition
- Live updates via Socket.io: slot counts and new events appear in real time without refreshing
- Events auto-expire via a cron job 2 hours after start time

## Roadmap / next steps
- [ ] Push notifications for nearby events (geofenced alerts)
- [ ] Let users drag a pin to set exact event location instead of using map center
- [ ] Trust/reputation system (no-show tracking, verified badge)
- [ ] Event chat for participants
- [ ] Recurring events (e.g. "weekly Tuesday pickup run")
- [ ] Migrate geo backend from Mongo to PostGIS if query complexity grows

## Notable technical decisions
- **Geospatial queries**: MongoDB's `2dsphere` index + `$nearSphere` powers "events within N miles," sorted by distance.
- **Race condition handling**: joining an event uses a single atomic `findOneAndUpdate` with a `$expr` size check, rather than a read-then-write, so two people can't both fill the last open spot.
- **Real-time architecture**: Socket.io rooms scope updates per-event so only people actively viewing an event's detail screen get its live slot-count updates, while a global broadcast handles new events showing up on the map.
