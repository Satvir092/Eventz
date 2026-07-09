const express = require("express");
const User = require("../models/User");
const Report = require("../models/Report");
const requireAuth = require("../middleware/auth");

const router = express.Router();

// Called periodically by the app (e.g. on launch, or when location changes
// meaningfully) so the server can match new nearby events to nearby users.
router.post("/me/push-registration", requireAuth, async (req, res) => {
  try {
    const { pushToken, lng, lat } = req.body;
    const update = {};
    if (pushToken) update.pushToken = pushToken;
    if (lng !== undefined && lat !== undefined) {
      update.lastLocation = { type: "Point", coordinates: [lng, lat] };
    }
    await User.findByIdAndUpdate(req.userId, update);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update push registration" });
  }
});

// Report a user for bad behavior (no-show, harassment, etc). Doesn't take
// automatic action beyond logging - a real moderation queue would review
// these, but a simple threshold-based reputation hit is applied here as a
// lightweight deterrent.
router.post("/:id/report", requireAuth, async (req, res) => {
  try {
    const { reason, eventId } = req.body;
    if (!reason) return res.status(400).json({ error: "A reason is required" });
    if (req.params.id === req.userId) {
      return res.status(400).json({ error: "You can't report yourself" });
    }

    await Report.create({
      reporter: req.userId,
      reportedUser: req.params.id,
      event: eventId,
      reason,
    });

    // Small automatic reputation hit per report - a real system would want
    // human review before this, but this keeps the MVP self-contained.
    await User.findByIdAndUpdate(req.params.id, { $inc: { reputationScore: -5 } });

    res.status(201).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to submit report" });
  }
});

module.exports = router;