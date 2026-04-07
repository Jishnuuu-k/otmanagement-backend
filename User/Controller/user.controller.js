const usecase = require("../Usecase/user.usecase");

// 🚀 Register
exports.register = async (req, res) => {
  try {
    const user = await usecase.registerUser(req.body);

    res.json({
      success: true,
      message: "User registered / OTP sent",
      data: user
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// ✅ Verify OTP
exports.verifyOTP = async (req, res) => {
  try {
    const { userId, otp } = req.body;

    const user = await usecase.verifyOTP(userId, otp);

    res.json({
      success: true,
      message: "User verified successfully",
      data: user
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};
