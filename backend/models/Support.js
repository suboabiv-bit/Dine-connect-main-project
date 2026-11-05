const mongoose = require("mongoose");

const supportSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    role: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true, maxlength: 3162 },
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", default: null },
    status: { type: String, enum: ["open", "in_progress", "resolved"], default: "open" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

module.exports = mongoose.model("Support", supportSchema);
