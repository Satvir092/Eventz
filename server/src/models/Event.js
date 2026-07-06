const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true }, // e.g. "3v3 pickup basketball"
    description: { type: String, trim: true },
    category: {
      type: String,
      enum: ["sports", "party", "study", "music", "other"],
      default: "other",
    },
    host: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // GeoJSON point - required shape for a 2dsphere index
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], required: true }, // [lng, lat]
    },
    address: { type: String }, // human-readable, optional

    startTime: { type: Date, required: true },
    // events auto-expire a bit after start; a cron job / TTL sweeps these
    expiresAt: { type: Date, required: true },

    slotsTotal: { type: Number, required: true, min: 1 },
    participants: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        joinedAt: { type: Date, default: Date.now },
      },
    ],

    status: {
      type: String,
      enum: ["open", "full", "cancelled", "expired"],
      default: "open",
    },
  },
  { timestamps: true }
);

// Geospatial index - enables $nearSphere / $geoWithin radius queries
eventSchema.index({ location: "2dsphere" });
// TTL-style helper index for cleanup queries (not a true Mongo TTL index,
// since we want a cron job to also emit socket events on expiry)
eventSchema.index({ expiresAt: 1 });

eventSchema.virtual("slotsOpen").get(function () {
  return Math.max(this.slotsTotal - this.participants.length, 0);
});

eventSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Event", eventSchema);
