const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const ensureAdminAccount = require("./config/ensureAdminAccount");
const orderRoutes = require("./routes/orderRoutes");
const authRoutes = require("./routes/authRoutes");
const ownerRoutes = require("./routes/ownerRoutes");
const publicRoutes = require("./routes/publicRoutes");
const kitchenRoutes = require("./routes/kitchenRoutes");
const managerRoutes = require("./routes/managerRoutes");
const supportRoutes = require("./routes/supportRoutes");

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
  credentials: true,
}));
app.use(express.json({ limit: "5mb" }));

app.get("/", (req, res) => {
  res.send("DineConnect Backend is Running!");
});

app.use("/api/auth", authRoutes);
app.use("/api/owner", ownerRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/kitchen", kitchenRoutes);
app.use("/api/manager", managerRoutes);
app.use("/api/support", supportRoutes);

const startServer = async () => {
  await connectDB();
  await ensureAdminAccount();

  const PORT = process.env.PORT || 3001;

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
