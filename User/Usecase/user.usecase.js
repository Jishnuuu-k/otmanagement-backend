const repo = require("../Repo/user.repo");
const Attendance = require("../Model/user.attendence");
const bcrypt = require("bcrypt");
const { transporter } = require("../../Config/Config");

// 🔢 Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// 📧 Send Email
const sendOTPEmail = async (email, otp) => {
  try {
    const info = await transporter.sendMail({
      from: `"OT TRACKER MGMNT SYSTEM" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your OTP Code - OT Management System",

      text: `Your OTP is ${otp}`, // ✅ fallback (important)

      html: `
      <div style="margin:0;padding:0;background-color:#f4f4f4;font-family:Arial, sans-serif;">
        <table align="center" width="100%" style="max-width:600px;background:#ffffff;border-radius:10px;overflow:hidden;">
          
          <!-- HEADER -->
          <tr>
            <td style="background:#000000;padding:20px;text-align:center;">
              <h1 style="color:#FFD700;margin:0;">OT MANAGEMENT</h1>
              <p style="color:#cccccc;margin:5px 0 0;">Secure Verification</p>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="padding:30px;text-align:center;">
              <h2 style="color:#333;">OTP Verification</h2>
              <p style="color:#555;font-size:16px;">
                Use the following One-Time Password to complete your verification.
              </p>

              <!-- OTP BOX -->
              <div style="
                display:inline-block;
                margin:20px 0;
                padding:15px 30px;
                font-size:28px;
                letter-spacing:5px;
                background:#000000;
                color:#FFD700;
                border-radius:8px;
                font-weight:bold;
              ">
                ${otp}
              </div>

              <p style="color:#777;font-size:14px;">
                This OTP is valid for <b>5 minutes</b>.
              </p>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:#f1f1f1;padding:20px;text-align:center;">
              <p style="color:#888;font-size:12px;margin:0;">
                If you did not request this, please ignore this email.
              </p>
              <p style="color:#aaa;font-size:11px;margin-top:5px;">
                © 2026 OT Management System
              </p>
            </td>
          </tr>

        </table>
      </div>
      `
    });

    console.log("📧 Email sent:", info.response);

  } catch (error) {
    console.log("❌ Email error:", error);
    throw error;
  }
};

// 🚀 REGISTER USER
exports.registerUser = async (data) => {
  const { email, employeeId, mobile, password } = data;

  const existing = await repo.findExistingUser(
    email,
    employeeId,
    mobile
  );

  // ❌ Already verified
  if (existing && existing.isVerified) {
    throw new Error("User already registered. Please login.");
  }

  // 🔁 Resend OTP
  if (existing && !existing.isVerified) {
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    await repo.updateOTP(existing._id, otp, otpExpiry);

    try {
      await sendOTPEmail(existing.email, otp);
    } catch (error) {
      throw new Error("Failed to send OTP email");
    }

    return {
      _id: existing._id,
      message: "OTP resent to email"
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

  try {
    await sendOTPEmail(email, otp);
  } catch (error) {
    throw new Error("Failed to send OTP email");
  }

  return user;
};

// ✅ VERIFY OTP
exports.verifyOTP = async (userId, otpInput) => {
  const user = await repo.findById(userId);

  if (!user) throw new Error("User not found");

  if (user.otp !== String(otpInput)) {
    throw new Error("Invalid OTP");
  }

  if (user.otpExpiry < new Date()) {
    throw new Error("OTP expired");
  }

  return await repo.verifyUser(userId);
};

// Helper
const getTodayDate = () => {
  return new Date().toISOString().split("T")[0];
};

const jwt = require("jsonwebtoken");

// 🔐 LOGIN USER
exports.loginUser = async (email, password) => {
  const user = await repo.findExistingUser(email, null, null);

  if (!user) {
    throw new Error("User not found");
  }

  if (!user.isVerified) {
    throw new Error("Please verify your account first");
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new Error("Invalid credentials");
  }

  // 🎟️ Generate Token
  const token = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  return {
    token,
    user: {
      id: user._id,
      fullName: user.fullName,
      email: user.email
    }
  };
};

// 🟢 PUNCH IN
exports.punchIn = async (userId) => {
  const today = getTodayDate();

  const existing = await Attendance.findOne({ userId, date: today });

  if (existing && existing.punchIn) {
    throw new Error("Already punched in today");
  }

  if (existing) {
    existing.punchIn = new Date();
    return await existing.save();
  }

  return await Attendance.create({
    userId,
    date: today,
    punchIn: new Date(),
  });
};

// 🔴 PUNCH OUT
exports.punchOut = async (userId) => {
  const today = getTodayDate();

  const record = await Attendance.findOne({ userId, date: today });

  if (!record || !record.punchIn) {
    throw new Error("Punch in first");
  }

  if (record.punchOut) {
    throw new Error("Already punched out");
  }

  record.punchOut = new Date();

  // ⏱️ Calculate worked hours
  const diff = (record.punchOut - record.punchIn) / (1000 * 60 * 60);
  record.workedHours = diff;

  // 🧠 OT Logic (8 hrs standard)
  record.otHours = diff > 8 ? diff - 8 : 0;

  return await record.save();
};

// 📊 MONTHLY OT
exports.calculateMonthlyOT = async (userId) => {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();

  const records = await Attendance.find({ userId });

  const monthlyRecords = records.filter((r) => {
    const d = new Date(r.date);
    return d.getMonth() === month && d.getFullYear() === year;
  });

  let totalOt = 0;

  const formatted = monthlyRecords.map((r) => {
    totalOt += r.otHours || 0;

    return {
      date: r.date,
      day: new Date(r.date).toLocaleDateString("en-US", { weekday: "short" }),
      punchIn: r.punchIn?.toLocaleTimeString(),
      punchOut: r.punchOut?.toLocaleTimeString(),
      workedHours: r.workedHours,
      otHours: r.otHours,
    };
  });

  return {
    totalOt,
    records: formatted,
  };
};

// 📚 ALL RECORDS
exports.getAllRecords = async (userId) => {
  const records = await Attendance.find({ userId }).sort({ date: -1 });

  return records.map((r) => ({
    date: r.date,
    day: new Date(r.date).toLocaleDateString("en-US", { weekday: "short" }),
    punchIn: r.punchIn?.toLocaleTimeString(),
    punchOut: r.punchOut?.toLocaleTimeString(),
    workedHours: r.workedHours,
    otHours: r.otHours,
  }));
};