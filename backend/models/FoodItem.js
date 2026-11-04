const mongoose = require("mongoose");

const foodItemSchema = new mongoose.Schema(
  {
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    category: { type: String, required: true, trim: true, default: "Other" },
    description: { type: String, trim: true, default: "" },
    image: { type: String, trim: true, default: "" },
    price: { type: Number, required: true, min: 0 },
    available: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("FoodItem", foodItemSchema);