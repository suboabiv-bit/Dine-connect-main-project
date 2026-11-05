
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Restaurant = require("../models/Restaurant");
const requireSession = require("../middleware/requireSession");

const router = express.Router();
const sessionCookie = "dineconnect_session";

const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

const slugify = (value) =>
  value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const createSession = (user, res) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured.");
  }

  const token = jwt.sign(
    { sub: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.cookie(sessionCookie, token, cookieOptions());
};

const publicUser = (user) => ({
  id: user.id,
  fullName: user.fullName,
  email: user.email,
  username: user.username,
  phone: user.phone,
  role: user.role,
  restaurantId: user.restaurantId,
  profilePicture: user.profilePicture,
});

// OWNER REGISTRATION
router.post("/register-owner", async (req, res) => {
  let restaurant;

  try {
    const {
      fullName,
      email,
      username,
      password,
      phone,
      restaurantName,
    } = req.body;

    if (
      !fullName?.trim() ||
      !email?.trim() ||
      !username?.trim() ||
      !restaurantName?.trim()
    ) {
      return res.status(400).json({
        message: "Name, email, username, and restaurant name are required.",
      });
    }

    if (typeof password !== "string" || password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters.",
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim().toLowerCase();

    if (
      await User.exists({
        $or: [
          { email: cleanEmail },
          { username: cleanUsername },
        ],
      })
    ) {
      return res.status(409).json({
        message: "That email or username is already registered.",
      });
    }

    const baseSlug =
      slugify(restaurantName) || `restaurant-${Date.now()}`;

    let slug = baseSlug;
    let suffix = 2;

    while (await Restaurant.exists({ slug })) {
      slug = `${baseSlug}-${suffix++}`;
    }

    restaurant = await Restaurant.create({
      name: restaurantName.trim(),
      slug,
      contactEmail: cleanEmail,
      contactNumber: phone || "",
      ownerId: new (require("mongoose")).Types.ObjectId(),
    });

    const user = await User.create({
      fullName: fullName.trim(),
      email: cleanEmail,
      username: cleanUsername,
      phone: phone || "",
      role: "owner",
      restaurantId: restaurant._id,
      passwordHash: await bcrypt.hash(password, 12),
    });

    restaurant.ownerId = user._id;
    await restaurant.save();

    createSession(user, res);

    return res.status(201).json({
      message: "Restaurant owner account created.",
      user: publicUser(user),
    });

  } catch (error) {
    // Print the actual error in the backend terminal
    console.error("Owner registration error:", error);

    if (restaurant) {
      await Restaurant.findByIdAndDelete(restaurant._id).catch(() => {});
    }

    const status = error.code === 11000 ? 409 : 500;

    return res.status(status).json({
      message:
        error.code === 11000
          ? "That email, username, or restaurant is already registered."
          : "Unable to create the owner account.",
    });
  }
});

// CUSTOMER REGISTRATION
router.post("/register", async (req, res) => {
  try {
    const { fullName, email, username, password, phone } = req.body;

    if (
      !fullName?.trim() ||
      !email?.trim() ||
      !username?.trim() ||
      typeof password !== "string" ||
      password.length < 8
    ) {
      return res.status(400).json({
        message:
          "Please provide your name, email, username, and a password of at least 8 characters.",
      });
    }

    const user = await User.create({
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      username: username.trim().toLowerCase(),
      phone: phone || "",
      passwordHash: await bcrypt.hash(password, 12),
      role: "customer",
    });

    return res.status(201).json({
      message: "Your account has been created.",
      user: publicUser(user),
    });

  } catch (error) {
    console.error("Customer registration error:", error);

    const status = error.code === 11000 ? 409 : 500;

    return res.status(status).json({
      message:
        error.code === 11000
          ? "That email or username is already registered."
          : "Unable to create the account.",
    });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { username, password, role } = req.body;

    const user = await User.findOne({
      username: String(username || "").toLowerCase().trim(),
    });

    if (
      !user ||
      !(await bcrypt.compare(String(password || ""), user.passwordHash))
    ) {
      return res.status(401).json({
        message: "Invalid username or password.",
      });
    }

    if (role && user.role !== role) {
      return res.status(403).json({
        message: "This account cannot sign in through that portal.",
      });
    }

    if (!user.restaurantId && user.role === "owner") {
      return res.status(403).json({
        message: "This owner account has no restaurant assigned.",
      });
    }

    createSession(user, res);

    return res.json({
      message: "Signed in successfully.",
      user: publicUser(user),
    });

  } catch (error) {
    console.error("Login error:", error);

    return res.status(503).json({
      message: "Unable to sign in. Check that authentication is configured.",
    });
  }
});

// GET CURRENT SIGNED-IN USER
router.get("/me", requireSession, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

// LOGOUT
router.post("/logout", (req, res) => {
  res.clearCookie(sessionCookie, {
    ...cookieOptions(),
    maxAge: undefined,
  });

  res.json({
    message: "Signed out.",
  });
});

module.exports = router;
