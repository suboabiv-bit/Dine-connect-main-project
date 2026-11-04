const express = require("express");
const router = express.Router();

const Order = require("../models/Order");
const requireOwner = require("../middleware/requireOwner");

// Create a new order
router.post("/", requireOwner, async (req, res) => {
  try {
    const newOrder = new Order({ ...req.body, restaurantId: req.restaurantId });

    const savedOrder = await newOrder.save();

    res.status(201).json({
      message: "Order created successfully!",
      order: savedOrder,
    });
  } catch (error) {
    res.status(400).json({
      message: "Failed to create order",
      error: error.message,
    });
  }
});

// Get all orders
router.get("/", requireOwner, async (req, res) => {
  try {
    const orders = await Order.find({ restaurantId: req.restaurantId }).sort({ createdAt: -1 });

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch orders",
      error: error.message,
    });
  }
});

module.exports = router;
