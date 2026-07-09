const mongoose = require("mongoose");
 
const reportSchema = new mongoose.Schema(
  {
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    reportedUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: "Event" },
    reason: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);
 
module.exports = mongoose.model("Report", reportSchema);