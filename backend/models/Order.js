const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      index: true,
    },

    orderNumber: {
      type: Number,
      required: true,
    },

    tableNumber: {
      type: String,
      required: true,
    },

    items: [
      {
        name: {
          type: String,
          required: true,
        },

        quantity: {
          type: Number,
          required: true,
        },

        price: {
          type: Number,
          required: true,
        },
        menuItemId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "FoodItem",
        },
        addOns: {
          type: [{
            id: String,
            name: String,
            price: Number,
          }],
          default: [],
        },
        removedIngredients: {
          type: [String],
          default: [],
        },
        drink: {
          type: String,
          default: "",
        },
        specialInstructions: {
          type: String,
          default: "",
          maxlength: 120,
        },
      },
    ],

    totalAmount: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: ["Pending", "Preparing", "Ready", "Completed", "Cancelled", "Received"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
