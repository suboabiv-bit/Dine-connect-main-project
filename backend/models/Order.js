const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
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
      },
    ],

    totalAmount: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      default: "Received",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
