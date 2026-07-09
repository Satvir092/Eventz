require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");

const connectDB = require("./config/db");
const createApp = require("./app");
const registerSocketHandlers = require("./sockets");
const startExpiryJob = require("./jobs/expireEvents");

async function main() {
  await connectDB();

  const server = http.createServer();
  const io = new Server(server, {
    cors: { origin: process.env.CLIENT_ORIGIN || "*" },
  });

  const app = createApp(io);
  server.on("request", app);

  registerSocketHandlers(io);
  startExpiryJob(io);

  const port = process.env.PORT || 4000;
  server.listen(port, () => console.log(`Server running on port ${port}`));
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});