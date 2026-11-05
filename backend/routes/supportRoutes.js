const express = require("express");
const Support = require("../models/Support");
const requireSession = require("../middleware/requireSession");

const router = express.Router();

router.post("/", requireSession, async (req, res) => {
  const body = req.body;
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return res.status(400).json({ message: "A JSON object is required." });
  }

  const subject = body.subject;
  const message = body.message ?? body.description;
  if (subject !== undefined && (typeof subject !== "string" || subject.trim().length > 160)) {
    return res.status(400).json({ message: "Subject must be a string of 160 characters or fewer." });
  }
  if (typeof message !== "string" || !message.trim() || message.trim().length > 3000) {
    return res.status(400).json({ message: "Message is required and must be 3000 characters or fewer." });
  }

  const fullMessage = subject?.trim() ? `${subject.trim()}\n\n${message.trim()}` : message.trim();
  try {
    const support = await Support.create({
      name: req.user.fullName,
      role: req.user.role,
      message: fullMessage,
      restaurant: req.user.restaurantId || null,
    });
    return res.status(201).json({ message: "Support request received.", support });
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({ message: "Invalid support request." });
    }
    console.error("Support request error:", error);
    return res.status(500).json({ message: "Unable to submit support request." });
  }
});

module.exports = router;
