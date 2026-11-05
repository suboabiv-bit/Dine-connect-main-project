const jwt = require("jsonwebtoken");
const User = require("../models/User");

const getCookie = (header, name) => {
  const entry = (header || "")
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));

  return entry ? decodeURIComponent(entry.slice(name.length + 1)) : "";
};

const requireSession = async (req, res, next) => {
  const token = getCookie(req.headers.cookie, "dineconnect_session");
  if (!token) return res.status(401).json({ message: "Please sign in to continue." });
  if (!process.env.JWT_SECRET) return res.status(503).json({ message: "Authentication is not configured." });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub).select(
      "fullName email username phone role restaurantId profilePicture createdAt"
    );

    if (!user || user.role !== payload.role || (user.role === "owner" && !user.restaurantId)) {
      return res.status(401).json({ message: "This account is no longer available." });
    }

    req.user = user;
    return next();
  } catch (error) {
    if (error.name === "TokenExpiredError" || error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Your session has expired. Please sign in again." });
    }

    return next(error);
  }
};

module.exports = requireSession;
