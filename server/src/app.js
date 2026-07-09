const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const eventRoutes = require("./routes/events");
const userRoutes = require("./routes/users");

// Builds the Express app without starting a listener, so tests can mount
// it with supertest. `io` can be a real Socket.io server or a no-op stub
// (tests don't care about real-time broadcast, just HTTP behavior).
function createApp(io) {
  const app = express();
  app.use(cors({ origin: process.env.CLIENT_ORIGIN || "*" }));
  app.use(express.json());

  app.set("io", io || { emit: () => {}, to: () => ({ emit: () => {} }) });

  app.get("/health", (req, res) => res.json({ ok: true }));
  app.use("/api/auth", authRoutes);
  app.use("/api/events", eventRoutes);
  app.use("/api/users", userRoutes);

  return app;
}

module.exports = createApp;