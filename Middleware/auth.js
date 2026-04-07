const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) throw new Error("No token");

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.userId = decoded.id;

    next();
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
};