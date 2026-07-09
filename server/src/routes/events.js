const express = require("express");
const Event = require("../models/Event");
const User = require("../models/User");
const requireAuth = require("../middleware/auth");
const { sendExpoPushNotifications } = require("../utils/pushNotifications");

const router = express.Router();

// Helper: default an event to expire 2 hours after its start time
function computeExpiry(startTime) {
  return new Date(new Date(startTime).getTime() + 2 * 60 * 60 * 1000);
}

// POST /api/events - create a new event
router.post("/", requireAuth, async (req, res) => {
  try {
    const { title, description, category, lng, lat, address, startTime, slotsTotal } = req.body;

    if (!title || lng === undefined || lat === undefined || !startTime || !slotsTotal) {
      return res.status(400).json({
        error: "title, lng, lat, startTime, and slotsTotal are required",
      });
    }

    const event = await Event.create({
      title,
      description,
      category,
      host: req.userId,
      location: { type: "Point", coordinates: [lng, lat] },
      address,
      startTime,
      expiresAt: computeExpiry(startTime),
      slotsTotal,
      participants: [{ user: req.userId }], // host auto-joins as first participant
    });

    const io = req.app.get("io");
    io.emit("event:created", event);

    // Geofenced push: alert other users within 2 miles who have a push
    // token and a recent known location, excluding the host.
    notifyNearbyUsers(event).catch((err) =>
      console.error("Failed to notify nearby users:", err.message)
    );

    res.status(201).json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create event" });
  }
});

async function notifyNearbyUsers(event) {
  const radiusMeters = 2 * 1609.34; // 2 miles
  const nearbyUsers = await User.find({
    _id: { $ne: event.host },
    pushToken: { $exists: true, $ne: null },
    lastLocation: {
      $nearSphere: {
        $geometry: { type: "Point", coordinates: event.location.coordinates },
        $maxDistance: radiusMeters,
      },
    },
  }).select("pushToken");

  const messages = nearbyUsers.map((u) => ({
    to: u.pushToken,
    sound: "default",
    title: "New event nearby",
    body: event.title,
    data: { eventId: event._id.toString() },
  }));

  await sendExpoPushNotifications(messages);
}

// GET /api/events/nearby?lng=&lat=&radiusMiles=&category=
router.get("/nearby", async (req, res) => {
  try {
    const { lng, lat, radiusMiles = 5, category } = req.query;
    if (lng === undefined || lat === undefined) {
      return res.status(400).json({ error: "lng and lat query params are required" });
    }

    const radiusMeters = Number(radiusMiles) * 1609.34;

    const filter = {
      location: {
        $nearSphere: {
          $geometry: { type: "Point", coordinates: [Number(lng), Number(lat)] },
          $maxDistance: radiusMeters,
        },
      },
      status: { $in: ["open", "full"] },
      expiresAt: { $gt: new Date() },
    };
    if (category) filter.category = category;

    const events = await Event.find(filter).populate("host", "name reputationScore").limit(100);
    res.json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch nearby events" });
  }
});

// GET /api/events/:id
router.get("/:id", async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate("host", "name reputationScore")
      .populate("participants.user", "name");
    if (!event) return res.status(404).json({ error: "Event not found" });
    res.json(event);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch event" });
  }
});

// POST /api/events/:id/join
// This is the "two people tap the last spot at once" race condition fix:
// the update only succeeds if, at write time, the participants array is
// still smaller than slotsTotal AND the user hasn't already joined.
// Mongo's atomic findOneAndUpdate makes this check-and-set a single
// operation instead of a read-then-write race.
router.post("/:id/join", requireAuth, async (req, res) => {
  try {
    const event = await Event.findOneAndUpdate(
      {
        _id: req.params.id,
        status: "open",
        "participants.user": { $ne: req.userId },
        $expr: { $lt: [{ $size: "$participants" }, "$slotsTotal"] },
      },
      { $push: { participants: { user: req.userId } } },
      { new: true }
    );

    if (!event) {
      // Either the event doesn't exist, is full, or user already joined.
      const exists = await Event.findById(req.params.id);
      if (!exists) return res.status(404).json({ error: "Event not found" });
      return res.status(409).json({ error: "Event is full or you've already joined" });
    }

    if (event.participants.length >= event.slotsTotal && event.status === "open") {
      event.status = "full";
      await event.save();
    }

    const io = req.app.get("io");
    io.to(`event:${event._id}`).emit("event:updated", event);

    res.json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to join event" });
  }
});

// POST /api/events/:id/leave
router.post("/:id/leave", requireAuth, async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      {
        $pull: { participants: { user: req.userId } },
        $set: { status: "open" },
      },
      { new: true }
    );

    if (!event) return res.status(404).json({ error: "Event not found" });

    const io = req.app.get("io");
    io.to(`event:${event._id}`).emit("event:updated", event);

    res.json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to leave event" });
  }
});

// POST /api/events/:id/attendance
// Host-only: after an event has started, mark which participants didn't
// show up. No-shows take a reputation hit; everyone else who was in the
// participant list gets a small credit and their joined count bumped.
router.post("/:id/attendance", requireAuth, async (req, res) => {
  try {
    const { noShowUserIds = [] } = req.body;
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: "Event not found" });
    if (String(event.host) !== req.userId) {
      return res.status(403).json({ error: "Only the host can record attendance" });
    }
    if (new Date(event.startTime) > new Date()) {
      return res.status(400).json({ error: "Can't record attendance before the event starts" });
    }

    const noShowSet = new Set(noShowUserIds.map(String));

    await Promise.all(
      event.participants.map(async (p) => {
        const userId = String(p.user);
        if (noShowSet.has(userId)) {
          await User.findByIdAndUpdate(userId, {
            $inc: { eventsNoShow: 1, reputationScore: -10 },
          });
        } else {
          await User.findByIdAndUpdate(userId, {
            $inc: { eventsJoined: 1, reputationScore: 2 },
          });
        }
      })
    );

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to record attendance" });
  }
});

module.exports = router;