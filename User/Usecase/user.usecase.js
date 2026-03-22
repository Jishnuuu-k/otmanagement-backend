const repo = require("../Repo/user.repo");
const bcrypt = require("bcrypt");

// 🔢 OTP generator
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// 🚀 REGISTER USER
exports.registerUser = async (data) => {
  const { email, employeeId, mobile, password } = data;

  // 🔍 Check existing user
  const existing = await repo.findExistingUser(
    email,
    employeeId,
    mobile
  );

  // ❌ Already verified user
  if (existing && existing.isVerified) {
    throw new Error("User already registered. Please login.");
  }

  // 🔁 Exists but not verified → resend OTP
  if (existing && !existing.isVerified) {
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    await repo.updateOTP(existing._id, otp, otpExpiry);

    console.log("🔁 Resent OTP:", otp);

    return {
      _id: existing._id,
      message: "OTP resent"
    };
  }

  // 🆕 New user
  const hashedPassword = await bcrypt.hash(password, 10);

  const otp = generateOTP();
  const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

  const user = await repo.createUser({
    ...data,
    password: hashedPassword,
    otp,
    otpExpiry
  });

  console.log("🆕 OTP:", otp);

  return user;
};

// ✅ VERIFY OTP
exports.verifyOTP = async (userId, otpInput) => {
  const user = await repo.findById(userId);

  if (!user) throw new Error("User not found");

  if (user.otp !== otpInput) {
    throw new Error("Invalid OTP");
  }

  if (user.otpExpiry < new Date()) {
    throw new Error("OTP expired");
  }

  return await repo.verifyUser(userId);
};