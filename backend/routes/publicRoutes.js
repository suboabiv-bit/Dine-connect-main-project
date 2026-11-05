const express = require("express");
const mongoose = require("mongoose");
const Restaurant = require("../models/Restaurant");
const FoodItem = require("../models/FoodItem");
const Order = require("../models/Order");

const router = express.Router();

router.get("/restaurants", async (req, res) => {
  const restaurants = await Restaurant.find().select("name slug address contactNumber").sort({ name: 1 });
  return res.json({ restaurants });
});

router.get("/restaurants/:slug/menu", async (req, res) => {
  const restaurant = await Restaurant.findOne({ slug: req.params.slug.toLowerCase() }).select("name slug address");
  if (!restaurant) return res.status(404).json({ message: "Restaurant not found." });
  const menu = await FoodItem.find({ restaurantId: restaurant._id, available: true }).sort({ category: 1, name: 1 });
  return res.json({ restaurant, menu });
});

router.get("/restaurants/:slug/orders/:orderId", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.orderId)) {
    return res.status(400).json({ message: "Invalid order ID." });
  }
  try {
    const restaurant = await Restaurant.findOne({ slug: req.params.slug.toLowerCase() }).select("_id");
    if (!restaurant) return res.status(404).json({ message: "Restaurant not found." });
    const order = await Order.findOne({
      _id: req.params.orderId,
      restaurantId: restaurant._id,
    }).select("orderNumber tableNumber items totalAmount status createdAt");
    if (!order) return res.status(404).json({ message: "Order not found." });
    return res.json({ order });
  } catch (error) {
    console.error("Public order status error:", error);
    return res.status(500).json({ message: "Unable to load order status." });
  }
});

router.post("/restaurants/:slug/orders", async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ slug: req.params.slug.toLowerCase() });
    if (!restaurant) return res.status(404).json({ message: "Restaurant not found." });
    const { tableNumber, items } = req.body;
    if (!String(tableNumber || "").trim() || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Table number and at least one menu item are required." });
    }

    const ids = items.map((item) => item.menuItemId);
    if (ids.some((id) => !require("mongoose").isValidObjectId(id))) {
      return res.status(400).json({ message: "One or more menu items are invalid." });
    }
    const menuItems = await FoodItem.find({
      _id: { $in: ids },
      restaurantId: restaurant._id,
      available: true,
    });
    if (menuItems.length !== new Set(ids.map(String)).size) {
      return res.status(400).json({ message: "One or more items are no longer available." });
    }

    const menuById = new Map(menuItems.map((item) => [String(item._id), item]));
    const orderItems = items.map((item) => {
      const menuItem = menuById.get(String(item.menuItemId));
      const quantity = Number(item.quantity);
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 50) throw new Error("Item quantities must be between 1 and 50.");
      return { menuItemId: menuItem._id, name: menuItem.name, quantity, price: menuItem.price };
    });
    const latestOrder = await Order.findOne({ restaurantId: restaurant._id }).sort({ orderNumber: -1 }).select("orderNumber");
    const orderNumber = (latestOrder?.orderNumber || 1000) + 1;
    const totalAmount = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const order = await Order.create({
      restaurantId: restaurant._id,
      orderNumber,
      tableNumber: String(tableNumber).trim(),
      items: orderItems,
      totalAmount,
      status: "Pending",
    });
    return res.status(201).json({ message: "Order received.", order });
  } catch (error) {
    return res.status(400).json({ message: error.message || "Unable to place order." });
  }
});

module.exports = router;