const cron = require("node-cron");
const Event = require("../models/Event");

// Runs every 5 minutes, marks past-expiry events as "expired" and
// notifies any connected clients still viewing them.
function startExpiryJob(io) {
  cron.schedule("*/5 * * * *", async () => {
    try {
      const expired = await Event.find({
        expiresAt: { $lte: new Date() },
        status: { $ne: "expired" },
      });

      for (const event of expired) {
        event.status = "expired";
        await event.save();
        io.to(`event:${event._id}`).emit("event:updated", event);
      }

      if (expired.length) {
        console.log(`Expired ${expired.length} event(s)`);
      }
    } catch (err) {
      console.error("Expiry job failed:", err.message);
    }
  });
}

module.exports = startExpiryJob;
