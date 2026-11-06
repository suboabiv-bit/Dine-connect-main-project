const mongoose = require("mongoose");
const FoodItem = require("../models/FoodItem");
const Order = require("../models/Order");
const Restaurant = require("../models/Restaurant");
const Staff = require("../models/Staff");

const ORDER_STATUSES = ["Pending", "Preparing", "Ready", "Completed", "Cancelled"];

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getOrdersForRestaurant = (restaurantId) => Order.find({ restaurantId }).sort({ createdAt: -1 });

const normalizeOrder = (order) => ({
  id: order._id,
  orderNumber: order.orderNumber,
  tableNumber: order.tableNumber,
  items: order.items.map((item) => ({
    name: item.name,
    quantity: item.quantity,
    price: item.price,
    menuItemId: item.menuItemId,
    addOns: item.addOns || [],
    removedIngredients: item.removedIngredients || [],
    drink: item.drink || "",
    specialInstructions: item.specialInstructions || "",
  })),
  totalAmount: order.totalAmount,
  status: order.status === "Received" ? "Pending" : order.status,
  orderDate: order.createdAt,
  orderTime: order.createdAt,
});

const buildSalesSeries = (orders, count, bucket) => {
  const now = new Date();
  const entries = [];
  if (bucket === "day") {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - count + 1);
    for (let offset = 0; offset < count; offset += 1) {
      const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + offset);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      entries.push({
        key,
        label: date.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
        amount: 0,
      });
    }
  } else {
    const start = new Date(now.getFullYear(), now.getMonth() - count + 1, 1);
    for (let offset = 0; offset < count; offset += 1) {
      const date = new Date(start.getFullYear(), start.getMonth() + offset, 1);
      entries.push({
        key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
        label: date.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
        amount: 0,
      });
    }
  }

  const index = new Map(entries.map((entry) => [entry.key, entry]));
  orders.forEach((order) => {
    if (order.status === "Cancelled") return;
    const date = new Date(order.createdAt);
    const key = bucket === "day"
      ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
      : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const entry = index.get(key);
    if (entry) entry.amount += order.totalAmount;
  });
  return entries;
};

const getBestSellers = async (restaurantId, orders) => {
  const sales = new Map();
  orders.filter((order) => order.status !== "Cancelled").forEach((order) => {
    order.items.forEach((item) => {
      const key = item.menuItemId ? String(item.menuItemId) : item.name;
      const current = sales.get(key) || {
        menuItemId: item.menuItemId,
        name: item.name,
        quantity: 0,
        revenue: 0,
        latestSale: order.createdAt,
      };
      current.quantity += item.quantity;
      current.revenue += item.price * item.quantity;
      if (new Date(order.createdAt) > new Date(current.latestSale)) current.latestSale = order.createdAt;
      sales.set(key, current);
    });
  });

  const items = await FoodItem.find({ restaurantId }).select("name category image");
  const itemMap = new Map(items.map((item) => [String(item._id), item]));
  return [...sales.values()]
    .map((sale) => ({
      ...sale,
      ...(sale.menuItemId && itemMap.has(String(sale.menuItemId))
        ? {
            name: itemMap.get(String(sale.menuItemId)).name,
            category: itemMap.get(String(sale.menuItemId)).category,
            image: itemMap.get(String(sale.menuItemId)).image,
          }
        : { category: "Other", image: "" }),
    }))
    .sort((left, right) => right.quantity - left.quantity)
    .slice(0, 6);
};

exports.getDashboard = async (req, res) => {
  try {
    const [restaurant, orders, foodItemsCount] = await Promise.all([
      Restaurant.findOne({ _id: req.restaurantId, ownerId: req.owner._id }),
      getOrdersForRestaurant(req.restaurantId),
      FoodItem.countDocuments({ restaurantId: req.restaurantId }),
    ]);
    const completedOrders = orders.filter((order) => order.status !== "Cancelled");
    const today = new Date();
    const todaySales = completedOrders
      .filter((order) => new Date(order.createdAt).toDateString() === today.toDateString())
      .reduce((sum, order) => sum + order.totalAmount, 0);
    const totalSales = completedOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const foodItemsSold = completedOrders.reduce(
      (sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
      0
    );
    const dailySales = buildSalesSeries(orders, 14, "day");
    const monthlySales = buildSalesSeries(orders, 12, "month");
    const currentMonthRevenue = monthlySales.at(-1)?.amount || 0;
    const previousMonthRevenue = monthlySales.at(-2)?.amount || 0;
    const recentThreeMonthsRevenue = monthlySales.slice(-3).reduce((sum, entry) => sum + entry.amount, 0);
    const bestSellers = await getBestSellers(req.restaurantId, orders);

    return res.json({
      restaurant,
      owner: {
        id: req.owner.id,
        fullName: req.owner.fullName,
        email: req.owner.email,
        username: req.owner.username,
        phone: req.owner.phone,
        profilePicture: req.owner.profilePicture,
        joinedAt: req.owner.createdAt,
      },
      metrics: {
        totalSales,
        todaySales,
        totalOrders: orders.length,
        foodItemsSold,
        foodItemsCount,
      },
      dailySales,
      monthlySales,
      revenueSummary: {
        currentMonth: currentMonthRevenue,
        previousMonth: previousMonthRevenue,
        lastThreeMonths: recentThreeMonthsRevenue,
        total: totalSales,
      },
      recentOrders: orders.slice(0, 6).map(normalizeOrder),
      bestSellers,
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to load restaurant dashboard.", error: error.message });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const query = { restaurantId: req.restaurantId };
    if (req.query.status && ORDER_STATUSES.includes(req.query.status)) query.status = req.query.status;
    const orders = await Order.find(query).sort({ createdAt: -1 }).limit(500);
    return res.json({ orders: orders.map(normalizeOrder) });
  } catch (error) {
    return res.status(500).json({ message: "Unable to load orders.", error: error.message });
  }
};

exports.getOrder = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.orderId)) return res.status(400).json({ message: "Invalid order ID." });
  const order = await Order.findOne({ _id: req.params.orderId, restaurantId: req.restaurantId });
  if (!order) return res.status(404).json({ message: "Order not found." });
  return res.json({ order: normalizeOrder(order) });
};

exports.updateOrderStatus = async (req, res) => {
  const { status } = req.body;
  if (!ORDER_STATUSES.includes(status)) return res.status(400).json({ message: "Choose a valid order status." });
  if (!mongoose.isValidObjectId(req.params.orderId)) return res.status(400).json({ message: "Invalid order ID." });
  const order = await Order.findOneAndUpdate(
    { _id: req.params.orderId, restaurantId: req.restaurantId },
    { status },
    { new: true, runValidators: true }
  );
  if (!order) return res.status(404).json({ message: "Order not found." });
  return res.json({ order: normalizeOrder(order) });
};

exports.getFoodItems = async (req, res) => {
  const [items, orders] = await Promise.all([
    FoodItem.find({ restaurantId: req.restaurantId }).sort({ createdAt: -1 }),
    Order.find({ restaurantId: req.restaurantId, status: { $ne: "Cancelled" } }).select("items createdAt"),
  ]);
  const sales = new Map();
  orders.forEach((order) => order.items.forEach((line) => {
    if (!line.menuItemId) return;
    const key = String(line.menuItemId);
    const value = sales.get(key) || { quantitySold: 0, revenue: 0, latestSale: null };
    value.quantitySold += line.quantity;
    value.revenue += line.price * line.quantity;
    if (!value.latestSale || order.createdAt > value.latestSale) value.latestSale = order.createdAt;
    sales.set(key, value);
  }));
  return res.json({
    items: items.map((item) => ({ ...item.toObject(), ...(sales.get(String(item._id)) || { quantitySold: 0, revenue: 0, latestSale: null }) })),
  });
};

exports.createFoodItem = async (req, res) => {
  const { name, category, description, image, price, available } = req.body;
  if (!name?.trim() || !category?.trim() || !Number.isFinite(Number(price)) || Number(price) < 0) {
    return res.status(400).json({ message: "Name, category, and a valid non-negative price are required." });
  }
  const item = await FoodItem.create({
    restaurantId: req.restaurantId,
    name: name.trim(),
    category: category.trim(),
    description: description || "",
    image: image || "",
    price: Number(price),
    available: available !== false,
  });
  return res.status(201).json({ item });
};

exports.updateFoodItem = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.itemId)) return res.status(400).json({ message: "Invalid food item ID." });
  const updates = {};
  ["name", "category", "description", "image", "available"].forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });
  if (req.body.price !== undefined) {
    if (!Number.isFinite(Number(req.body.price)) || Number(req.body.price) < 0) return res.status(400).json({ message: "Price must be a non-negative number." });
    updates.price = Number(req.body.price);
  }
  const item = await FoodItem.findOneAndUpdate(
    { _id: req.params.itemId, restaurantId: req.restaurantId },
    updates,
    { new: true, runValidators: true }
  );
  if (!item) return res.status(404).json({ message: "Food item not found." });
  return res.json({ item });
};

exports.deleteFoodItem = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.itemId)) return res.status(400).json({ message: "Invalid food item ID." });
  const item = await FoodItem.findOneAndDelete({ _id: req.params.itemId, restaurantId: req.restaurantId });
  if (!item) return res.status(404).json({ message: "Food item not found." });
  return res.json({ message: "Food item deleted." });
};

exports.getStaff = async (req, res) => {
  const staff = await Staff.find({ restaurantId: req.restaurantId }).sort({ name: 1 });
  return res.json({ staff });
};

exports.createStaff = async (req, res) => {
  const { name, position, joinDate, monthlySalary, contact, status } = req.body;
  if (!name?.trim() || !position?.trim()) return res.status(400).json({ message: "Staff name and job position are required." });
  const staff = await Staff.create({
    restaurantId: req.restaurantId,
    staffId: `STF-${Date.now().toString().slice(-7)}`,
    name: name.trim(),
    position: position.trim(),
    joinDate: joinDate || Date.now(),
    monthlySalary: Number(monthlySalary) || 0,
    contact: contact || "",
    status: status || "Active",
  });
  return res.status(201).json({ staff });
};

exports.updateStaff = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.staffId)) return res.status(400).json({ message: "Invalid staff ID." });
  const updates = {};
  ["name", "position", "joinDate", "monthlySalary", "contact", "status"].forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = field === "monthlySalary" ? Number(req.body[field]) : req.body[field];
  });
  const staff = await Staff.findOneAndUpdate(
    { _id: req.params.staffId, restaurantId: req.restaurantId },
    updates,
    { new: true, runValidators: true }
  );
  if (!staff) return res.status(404).json({ message: "Staff member not found." });
  return res.json({ staff });
};

exports.deleteStaff = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.staffId)) return res.status(400).json({ message: "Invalid staff ID." });
  const staff = await Staff.findOneAndDelete({ _id: req.params.staffId, restaurantId: req.restaurantId });
  if (!staff) return res.status(404).json({ message: "Staff member not found." });
  return res.json({ message: "Staff member deleted." });
};

exports.updateProfile = async (req, res) => {
  const { fullName, email, phone, profilePicture, restaurantName, address } = req.body;
  if (fullName !== undefined && !fullName.trim()) return res.status(400).json({ message: "Owner name cannot be empty." });
  if (profilePicture && profilePicture.length > 4_000_000) return res.status(413).json({ message: "Profile image is too large." });
  if (profilePicture && !/^data:image\/(png|jpeg|webp);base64,/.test(profilePicture)) {
    return res.status(400).json({ message: "Profile image must be PNG, JPEG, or WebP." });
  }
  const ownerUpdates = {};
  if (fullName !== undefined) ownerUpdates.fullName = fullName.trim();
  if (email !== undefined) ownerUpdates.email = email.trim().toLowerCase();
  if (phone !== undefined) ownerUpdates.phone = phone.trim();
  if (profilePicture !== undefined) ownerUpdates.profilePicture = profilePicture;
  if (Object.keys(ownerUpdates).length) await req.owner.updateOne(ownerUpdates);

  const restaurantUpdates = {};
  if (restaurantName !== undefined) restaurantUpdates.name = restaurantName.trim();
  if (email !== undefined) restaurantUpdates.contactEmail = email.trim().toLowerCase();
  if (phone !== undefined) restaurantUpdates.contactNumber = phone.trim();
  if (address !== undefined) restaurantUpdates.address = address.trim();
  const restaurant = await Restaurant.findOneAndUpdate(
    { _id: req.restaurantId, ownerId: req.owner._id },
    restaurantUpdates,
    { new: true, runValidators: true }
  );
  const owner = await req.owner.constructor.findById(req.owner._id).select("fullName email username phone profilePicture createdAt");
  return res.json({ owner, restaurant });
};

exports.getRestaurantForSlug = async (slug) => Restaurant.findOne({ slug: new RegExp(`^${escapeRegex(slug)}$`, "i") });

exports.normalizeOrder = normalizeOrder;
exports.orderStatuses = ORDER_STATUSES;