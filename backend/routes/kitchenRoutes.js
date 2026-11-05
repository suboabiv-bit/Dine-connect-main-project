const express = require("express");
const mongoose = require("mongoose");
const Order = require("../models/Order");
const requireSession = require("../middleware/requireSession");

const router = express.Router();
const ALLOWED_ROLES = ["kitchen", "manager", "owner", "admin"];
const STATUS_TO_DATABASE = {
  received: "Pending",
  preparing: "Preparing",
  ready: "Ready",
  served: "Completed",
};
const DATABASE_TO_STATUS = {
  Pending: "received",
  Received: "received",
  Preparing: "preparing",
  Ready: "ready",
  Completed: "served",
  Cancelled: "cancelled",
};
const STEPS = Object.keys(STATUS_TO_DATABASE);

router.use(requireSession, (req, res, next) => {
  if (!ALLOWED_ROLES.includes(req.user.role)) {
    return res.status(403).json({ message: "Kitchen access only." });
  }
  if (req.user.role !== "admin" && !req.user.restaurantId) {
    return res.status(403).json({ message: "This account has no restaurant assigned." });
  }
  return next();
});

const restaurantFilter = (user) => user.role === "admin"
  ? {}
  : { restaurantId: user.restaurantId };

router.get("/orders", async (req, res) => {
  try {
    const orders = await Order.find({
      ...restaurantFilter(req.user),
      status: { $in: ["Pending", "Received", "Preparing", "Ready"] },
    })
      .sort({ createdAt: 1 })
      .lean();
    return res.json({
      orders: orders.map((order) => ({
        ...order,
        status: DATABASE_TO_STATUS[order.status] || "received",
      })),
    });
  } catch (error) {
    console.error("Kitchen load error:", error);
    return res.status(500).json({ message: "Unable to load restaurant orders." });
  }
});

router.patch("/orders/:id/status", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid order ID." });
  }
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    return res.status(400).json({ message: "A JSON object is required." });
  }
  const { status } = req.body;
  if (!STEPS.includes(status)) {
    return res.status(400).json({ message: "Invalid status." });
  }

  try {
    const order = await Order.findOne({
      _id: req.params.id,
      ...restaurantFilter(req.user),
    });
    if (!order) return res.status(404).json({ message: "Order not found." });

    const currentStatus = DATABASE_TO_STATUS[order.status];
    if (!currentStatus || STEPS.indexOf(status) !== STEPS.indexOf(currentStatus) + 1) {
      return res.status(400).json({ message: "Orders can only move to the next step." });
    }

    order.status = STATUS_TO_DATABASE[status];
    await order.save();
    return res.json({
      order: { ...order.toObject(), status },
    });
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({ message: "Invalid order update." });
    }
    console.error("Kitchen update error:", error);
    return res.status(500).json({ message: "Unable to update order status." });
  }
});

module.exports = router;
