// Lets only a signed-in ADMIN reach the kitchen routes.
// It reads the login token from the "token" cookie (or an Authorization header).
const jwt = require("jsonwebtoken");

const getTokenFromCookie = (req) => {
  const raw = req.headers.cookie || "";
  const found = raw
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("token="));
  return found ? decodeURIComponent(found.slice("token=".length)) : null;
};

module.exports = function requireAdmin(req, res, next) {
  const header = req.headers.authorization || "";
  const token =
    getTokenFromCookie(req) ||
    (header.startsWith("Bearer ") ? header.slice(7) : null);

  if (!token) {
    return res.status(401).json({ message: "Please sign in first." });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    if (payload.role !== "admin") {
      return res.status(403).json({ message: "Admin access only." });
    }

    req.user = payload;
    next();
  } catch (error) {
  
    return res
      .status(401)
      .json({ message: "Session expired. Please sign in again." });
  }
};