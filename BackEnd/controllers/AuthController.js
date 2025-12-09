import bcrypt from "bcrypt";
import User from "../models/UserDB.js";
import jwt from "jsonwebtoken";
import { sendEmail } from "../config/emailConfig.js"


export const registerUser = async (req, res) => {
  try {
    const { fullName, email, password, role, secretKey, mobile } = req.body;

    // ✅ Basic validation
    if (!fullName || !email || !password || !role || !secretKey) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // ✅ Validate secret key based on role
    if (role === "Admin" && secretKey !== process.env.ADMIN_SECRET_KEY) {
      return res.status(403).json({ message: "Invalid Admin secret key." });
    } else if (role === "HR" && secretKey !== process.env.HR_SECRET_KEY) {
      return res.status(403).json({ message: "Invalid HR secret key." });
    }

    // ✅ Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists." });
    }
    const existingMobile = await User.findOne({ mobile });
    if (existingMobile) {
      return res.status(409).json({ message: "User already exists." });
    }

    // ✅ Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Create new user
    const newUser = new User({
      fullName,
      email,
      mobile,
      password: hashedPassword,
      role,
    });

    await newUser.save();

    return res
      .status(201)
      .json({ message: "Registration successful!", user: newUser });
  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};


//Login user (HR/Admin)
export const loginUser = async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password || !role)
      return res.status(400).json({ message: "All fields are required." });

    const user = await User.findOne({ email, role }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found." });

    if (user.status !== "Active") {
      return res.status(404).json({ message: "Your account is inactive please contact to Admin" })
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid)
      return res.status(401).json({ message: "Invalid credentials." });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    res.status(200).json({ message: "Login successful!", user, token });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};

// ✅ Check Auth (auto-login if cookie valid)
export const checkAuth = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found." });
    res.json({ message: "User authenticated", user });
  } catch (err) {
    res.status(500).json({ message: "Error verifying user." });
  }
};

// ✅ Logout Controller
export const logoutUser = (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out successfully." });
};






// Temporary in-memory OTP store
const otpStore = new Map(); // key = email, value = { otp, expiresAt }

// 📤 Send OTP
export const forgotPassword = async (req, res) => {
  try {
    const { email, role } = req.body;
    const user = await User.findOne({ email, role });

    if (!user) {
      return res.status(404).json({ message: "No user found with this email and role" });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    // Save OTP in memory
    otpStore.set(email, { otp, expiresAt });

    // Automatically delete OTP after 5 minutes
    setTimeout(() => otpStore.delete(email), 5 * 60 * 1000);

    // Send OTP via email
    await sendEmail(
      email,
      "Password Reset OTP - Graphura Intern System",
      `
  <div style="font-family: Arial, sans-serif; padding: 10px;">
    <h2 style="color:#4f46e5;">Graphura Intern System</h2>
    <p>Use the OTP below to reset your password:</p>
    <h1 style="color:#16a34a;">${otp}</h1>
    <p>This OTP is valid for <b>5 minutes</b>.</p>
    <hr/>
    <p style="font-size: 12px; color: gray;">Do not share this code with anyone.</p>
  </div>
  `
    );

    res.status(200).json({ message: "OTP sent successfully!" });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({ message: "Error sending OTP, please try again." });
  }
};

// ✅ Verify OTP
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const storedOtp = otpStore.get(email);

    if (!storedOtp) {
      return res.status(400).json({ message: "OTP not found or expired" });
    }

    if (storedOtp.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (storedOtp.expiresAt < Date.now()) {
      otpStore.delete(email);
      return res.status(400).json({ message: "OTP has expired" });
    }

    res.status(200).json({ message: "OTP verified successfully" });
  } catch (error) {
    console.error("Verify OTP Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// 🔒 Reset Password
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const storedOtp = otpStore.get(email);

    if (!storedOtp) {
      return res.status(400).json({ message: "OTP not found or expired" });
    }

    if (storedOtp.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (storedOtp.expiresAt < Date.now()) {
      otpStore.delete(email);
      return res.status(400).json({ message: "OTP expired. Please request again." });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Update password securely
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    // Delete OTP after success
    otpStore.delete(email);

    res.status(200).json({ message: "Password reset successfully!" });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// 🔁 Resend OTP
export const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: "User not found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000;

    otpStore.set(email, { otp, expiresAt });
    setTimeout(() => otpStore.delete(email), 5 * 60 * 1000);

    await sendEmail(
      email,
      "Resend OTP - Graphura Intern System",
      `
    <h2>Your new OTP</h2>
    <h3>${otp}</h3>
    <p>Valid for 5 minutes.</p>
  `
    );

    res.status(200).json({ message: "OTP resent successfully!" });
  } catch (error) {
    console.error("Resend OTP Error:", error);
    res.status(500).json({ message: "Failed to resend OTP" });
  }
};
