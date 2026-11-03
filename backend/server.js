const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const orderRoutes = require("./routes/orderRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("DineConnect Backend is Running!");
});

// Order API
app.use("/api/orders", orderRoutes);

const startServer = async () => {
  await connectDB();

  const PORT = process.env.PORT || 5000;

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
