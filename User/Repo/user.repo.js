const User = require("../Model/user.model");

// 🔍 find existing user
exports.findExistingUser = async (email, employeeId, mobile) => {
  return await User.findOne({
    $or: [{ email }, { employeeId }, { mobile }]
  });
};

// ➕ create user
exports.createUser = async (data) => {
  return await User.create(data);
};

// 🔄 update OTP
exports.updateOTP = async (id, otp, otpExpiry) => {
  return await User.findByIdAndUpdate(
    id,
    { otp, otpExpiry },
    { returnDocument: "after" } // ✅ FIXED
  );
};

// 🔍 find by ID
exports.findById = async (id) => {
  return await User.findById(id);
};

// ✅ verify user
exports.verifyUser = async (id) => {
  return await User.findByIdAndUpdate(
    id,
    { isVerified: true, otp: null ,otpExpiry: null},
    { returnDocument: "after" }
  );
};