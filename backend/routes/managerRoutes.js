const express = require("express");
const mongoose = require("mongoose");
const requireSession = require("../middleware/requireSession");
const manager = require("../controllers/managerController");

const router = express.Router();

router.use(requireSession, (req, res, next) => {
  if (req.user.role !== "manager") {
    return res.status(403).json({ message: "Manager access is required." });
  }
  if (!req.user.restaurantId || !mongoose.isValidObjectId(req.user.restaurantId)) {
    return res.status(403).json({ message: "This manager account has no restaurant assigned." });
  }
  return next();
});

router.get("/restaurant", manager.getRestaurant);
router.patch("/restaurant", manager.updateRestaurant);
router.get("/menu", manager.getMenu);
router.post("/menu", manager.createMenuItem);
router.patch("/menu/:id", manager.updateMenuItem);
router.delete("/menu/:id", manager.deleteMenuItem);
router.get("/orders", manager.getOrders);

module.exports = router;
