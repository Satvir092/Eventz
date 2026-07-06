// Clients join a room per event they're viewing, so we only broadcast
// slot-count changes to people actually looking at that event (plus a
// global room for the map/feed view).
function registerSocketHandlers(io) {
  io.on("connection", (socket) => {
    socket.on("event:subscribe", (eventId) => {
      socket.join(`event:${eventId}`);
    });

    socket.on("event:unsubscribe", (eventId) => {
      socket.leave(`event:${eventId}`);
    });

    socket.on("disconnect", () => {
      // no-op for now - room membership is cleaned up automatically
    });
  });
}

module.exports = registerSocketHandlers;
