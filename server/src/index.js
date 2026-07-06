require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const connectDB = require("./config/db");
const registerSocketHandlers = require("./sockets");
const startExpiryJob = require("./jobs/expireEvents");

const authRoutes = require("./routes/auth");
const eventRoutes = require("./routes/events");

async function main() {
  await connectDB();

  const app = express();
  app.use(cors({ origin: process.env.CLIENT_ORIGIN || "*" }));
  app.use(express.json());

  app.get("/health", (req, res) => res.json({ ok: true }));
  app.use("/api/auth", authRoutes);
  app.use("/api/events", eventRoutes);

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: process.env.CLIENT_ORIGIN || "*" },
  });

  // Make io available inside route handlers via req.app.get("io")
  app.set("io", io);

  registerSocketHandlers(io);
  startExpiryJob(io);

  const port = process.env.PORT || 4000;
  server.listen(port, () => console.log(`Server running on port ${port}`));
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
