require("dotenv").config();
const express = require("express");
const cors = require("cors");
const {connectDB} = require("./Config/Config");
const userRoutes = require("./User/Routes/user.route");

const app = express();

// connect DB
connectDB();

// middleware
app.use(cors());
app.use(express.json());

// routes
app.use("/api/user", userRoutes);

// server
app.listen(5000, () => {
  console.log("🚀 Server running on http://localhost:5000");
});