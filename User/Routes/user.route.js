const express = require("express");
const router = express.Router();
const controller = require("../Controller/user.controller");

router.post("/register", controller.register);
router.post("/verify-otp", controller.verifyOTP);

module.exports = router;