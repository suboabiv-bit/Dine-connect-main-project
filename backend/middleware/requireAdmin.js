
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const getCookie = (header, name) => {
  const entry = (header || "")
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));

  return entry
    ? decodeURIComponent(entry.slice(name.length + 1))
    : "";
};

const requireAdmin = async (req, res, next) => {
  const token = getCookie(
    req.headers.cookie,
    "dineconnect_session"
  );

  if (!token) {
    return res.status(401).json({
      message: "Please sign in to continue.",
    });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(503).json({
      message: "Authentication is not configured.",
    });
  }

  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    if (payload.role !== "admin") {
      return res.status(403).json({
        message: "Admin access is required.",
      });
    }

    const user = await User.findById(payload.sub).select(
      "fullName email username phone role profilePicture createdAt"
    );

    if (!user || user.role !== "admin") {
      return res.status(401).json({
        message: "This admin account is no longer available.",
      });
    }

    req.admin = user;

    return next();
  } catch {
    return res.status(401).json({
      message: "Your session has expired. Please sign in again.",
    });
  }
};

module.exports = requireAdmin;
