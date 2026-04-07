const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: String, // "2026-04-06"
      required: true,
    },
    punchIn: Date,
    punchOut: Date,
    workedHours: Number,
    otHours: Number,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Attendance", attendanceSchema);