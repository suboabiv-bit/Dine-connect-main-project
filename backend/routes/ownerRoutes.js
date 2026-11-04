const express = require("express");
const requireOwner = require("../middleware/requireOwner");
const owner = require("../controllers/ownerController");

const router = express.Router();
router.use(requireOwner);

router.get("/dashboard", owner.getDashboard);
router.get("/orders", owner.getOrders);
router.get("/orders/:orderId", owner.getOrder);
router.patch("/orders/:orderId/status", owner.updateOrderStatus);
router.get("/food-items", owner.getFoodItems);
router.post("/food-items", owner.createFoodItem);
router.patch("/food-items/:itemId", owner.updateFoodItem);
router.delete("/food-items/:itemId", owner.deleteFoodItem);
router.get("/staff", owner.getStaff);
router.post("/staff", owner.createStaff);
router.patch("/staff/:staffId", owner.updateStaff);
router.delete("/staff/:staffId", owner.deleteStaff);
router.patch("/profile", owner.updateProfile);

module.exports = router;