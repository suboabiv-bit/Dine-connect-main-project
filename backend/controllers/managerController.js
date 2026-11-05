const mongoose = require("mongoose");
const FoodItem = require("../models/FoodItem");
const Order = require("../models/Order");
const Restaurant = require("../models/Restaurant");

const ORDER_STATUS = {
  Pending: "received",
  Received: "received",
  Preparing: "preparing",
  Ready: "ready",
  Completed: "served",
  Cancelled: "cancelled",
};

const handleError = (res, error, message) => {
  if (error.name === "ValidationError" || error.name === "CastError") {
    return res.status(400).json({ message: "Invalid request data." });
  }
  if (error.code === 11000) {
    return res.status(409).json({ message: "A record with those details already exists." });
  }
  console.error(message, error);
  return res.status(500).json({ message });
};

const isPlainObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

exports.getRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.user.restaurantId);
    if (!restaurant) return res.status(404).json({ message: "Restaurant not found." });
    return res.json({ restaurant });
  } catch (error) {
    return handleError(res, error, "Unable to load restaurant information.");
  }
};

exports.updateRestaurant = async (req, res) => {
  if (!isPlainObject(req.body)) return res.status(400).json({ message: "A JSON object is required." });
  const allowedFields = ["name", "contactEmail", "contactNumber", "address"];
  const updates = {};

  for (const field of allowedFields) {
    if (req.body[field] === undefined) continue;
    if (typeof req.body[field] !== "string" || !req.body[field].trim()) {
      return res.status(400).json({ message: `${field} must be a non-empty string.` });
    }
    updates[field] = req.body[field].trim();
  }

  if (!Object.keys(updates).length) {
    return res.status(400).json({ message: "Provide at least one valid restaurant field to update." });
  }
  if (updates.name && updates.name.length > 120) {
    return res.status(400).json({ message: "Restaurant name must be 120 characters or fewer." });
  }
  if (updates.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updates.contactEmail)) {
    return res.status(400).json({ message: "Enter a valid contact email." });
  }

  try {
    const restaurant = await Restaurant.findByIdAndUpdate(
      req.user.restaurantId,
      updates,
      { new: true, runValidators: true }
    );
    if (!restaurant) return res.status(404).json({ message: "Restaurant not found." });
    return res.json({ restaurant });
  } catch (error) {
    return handleError(res, error, "Unable to update restaurant information.");
  }
};

exports.getMenu = async (req, res) => {
  try {
    const items = await FoodItem.find({ restaurantId: req.user.restaurantId }).sort({ name: 1 });
    return res.json({ items });
  } catch (error) {
    return handleError(res, error, "Unable to load restaurant menu.");
  }
};

exports.createMenuItem = async (req, res) => {
  if (!isPlainObject(req.body)) return res.status(400).json({ message: "A JSON object is required." });
  const { name, category, description = "", image = "", price } = req.body;
  if (typeof name !== "string" || !name.trim() || name.trim().length > 120) {
    return res.status(400).json({ message: "Name is required and must be 120 characters or fewer." });
  }
  if (typeof category !== "string" || !category.trim() || category.trim().length > 80) {
    return res.status(400).json({ message: "Category is required and must be 80 characters or fewer." });
  }
  if (typeof price !== "number" || !Number.isFinite(price) || price < 0) {
    return res.status(400).json({ message: "Price must be a non-negative number." });
  }
  if (typeof description !== "string" || description.length > 1000) {
    return res.status(400).json({ message: "Description must be a string of 1000 characters or fewer." });
  }
  if (typeof image !== "string" || image.length > 2000) {
    return res.status(400).json({ message: "Image must be a string of 2000 characters or fewer." });
  }

  try {
    const item = await FoodItem.create({
      restaurantId: req.user.restaurantId,
      name: name.trim(),
      category: category.trim(),
      description: description.trim(),
      image: image.trim(),
      price,
    });
    return res.status(201).json({ item });
  } catch (error) {
    return handleError(res, error, "Unable to add menu item.");
  }
};

exports.updateMenuItem = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid menu item ID." });
  }
  if (!isPlainObject(req.body)) return res.status(400).json({ message: "A JSON object is required." });

  const fields = ["name", "category", "description", "image", "price", "available"];
  const updates = {};
  for (const field of fields) {
    if (req.body[field] === undefined) continue;
    const value = req.body[field];
    if (["name", "category"].includes(field)) {
      const maxLength = field === "name" ? 120 : 80;
      if (typeof value !== "string" || !value.trim() || value.trim().length > maxLength) {
        return res.status(400).json({ message: `${field} must be a non-empty string of at most ${maxLength} characters.` });
      }
      updates[field] = value.trim();
    } else if (field === "description" || field === "image") {
      const maxLength = field === "description" ? 1000 : 2000;
      if (typeof value !== "string" || value.length > maxLength) {
        return res.status(400).json({ message: `${field} must be a string of at most ${maxLength} characters.` });
      }
      updates[field] = value.trim();
    } else if (field === "price") {
      if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
        return res.status(400).json({ message: "Price must be a non-negative number." });
      }
      updates.price = value;
    } else {
      if (typeof value !== "boolean") {
        return res.status(400).json({ message: "Availability must be true or false." });
      }
      updates.available = value;
    }
  }
  if (!Object.keys(updates).length) {
    return res.status(400).json({ message: "Provide at least one valid menu item field to update." });
  }

  try {
    const item = await FoodItem.findOneAndUpdate(
      { _id: req.params.id, restaurantId: req.user.restaurantId },
      updates,
      { new: true, runValidators: true }
    );
    if (!item) return res.status(404).json({ message: "Menu item not found." });
    return res.json({ item });
  } catch (error) {
    return handleError(res, error, "Unable to update menu item.");
  }
};

exports.deleteMenuItem = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid menu item ID." });
  }
  try {
    const item = await FoodItem.findOneAndDelete({
      _id: req.params.id,
      restaurantId: req.user.restaurantId,
    });
    if (!item) return res.status(404).json({ message: "Menu item not found." });
    return res.json({ message: "Menu item deleted." });
  } catch (error) {
    return handleError(res, error, "Unable to delete menu item.");
  }
};

exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find({ restaurantId: req.user.restaurantId })
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();
    return res.json({
      orders: orders.map((order) => ({
        ...order,
        total: order.totalAmount,
        status: ORDER_STATUS[order.status] || "received",
      })),
    });
  } catch (error) {
    return handleError(res, error, "Unable to load restaurant orders.");
  }
};
