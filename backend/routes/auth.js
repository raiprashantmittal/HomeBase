const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const User = require("../models/User");
const requireAuth = require("../middleware/auth");
const { sendMail } = require("../utils/mailer");
const { featuresOverviewHtml } = require("../utils/emailContent");

function generateToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000)); // 6 digits
}

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ error: "name, email, and password are required" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res
        .status(409)
        .json({ error: "An account with this email already exists" });
    }

    const user = new User({ name, email, phone });
    await user.setPassword(password);
    await user.save();
    sendMail({
      to: user.email,
      subject: "Welcome to Homebase 👋",
      html: `
    <p>Hi ${user.name},</p>
    <p>Welcome to Homebase — one place to manage your family's care, money, and tasks
    without juggling separate apps and group chats.</p>
    ${featuresOverviewHtml()}
    <p>Next step: create your family space (or join one with an invite code) and add
    whoever's part of it — parents, siblings, spouse.</p>
    <p>Glad to have you here.</p>
  `,
    }).catch((err) =>
      console.error("[auth] Welcome email failed:", err.message),
    );

    const token = generateToken(user._id);
    res.status(201).json({ token, user: user.toSafeObject() });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Registration failed", details: err.message });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const valid = await user.checkPassword(password);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = generateToken(user._id);
    res.json({ token, user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ error: "Login failed", details: err.message });
  }
});

// POST /api/auth/change-password — logged-in user changes their password (knows the old one)
router.post("/change-password", requireAuth, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res
        .status(400)
        .json({ error: "oldPassword and newPassword are required" });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const valid = await user.checkPassword(oldPassword);
    if (!valid)
      return res.status(401).json({ error: "Old password is incorrect" });

    await user.setPassword(newPassword);
    await user.save();
    res.json({ message: "Password changed successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Could not change password", details: err.message });
  }
});

// POST /api/auth/forgot-password/reset-with-old-password
// For a signed-out user who still remembers their old password (email + old + new, no OTP needed)
router.post("/forgot-password/reset-with-old-password", async (req, res) => {
  try {
    const { email, oldPassword, newPassword } = req.body;
    if (!email || !oldPassword || !newPassword) {
      return res
        .status(400)
        .json({ error: "email, oldPassword, and newPassword are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user)
      return res
        .status(401)
        .json({ error: "Email or old password is incorrect" });

    const valid = await user.checkPassword(oldPassword);
    if (!valid)
      return res
        .status(401)
        .json({ error: "Email or old password is incorrect" });

    await user.setPassword(newPassword);
    await user.save();
    res.json({ message: "Password reset successfully — you can now sign in" });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Could not reset password", details: err.message });
  }
});

// POST /api/auth/forgot-password/request-otp
// For a user who doesn't remember their old password — emails a 6-digit OTP
router.post("/forgot-password/request-otp", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "email is required" });

    const user = await User.findOne({ email: email.toLowerCase() });
    // Always respond success even if no account exists, so this can't be used to check
    // which emails have accounts.
    if (!user) {
      return res.json({
        message: "If that email has an account, an OTP has been sent.",
      });
    }

    const otp = generateOtp();
    await user.setResetOtp(otp);
    await user.save();

    await sendMail({
      to: user.email,
      subject: "Your Homebase password reset code",
      html: `
        <p>Hi ${user.name},</p>
        <p>Your password reset code is:</p>
        <h2 style="letter-spacing: 4px;">${otp}</h2>
        <p>This code expires in 10 minutes. If you didn't request this, you can ignore this email.</p>
      `,
    });

    res.json({
      message: "If that email has an account, an OTP has been sent.",
    });
  } catch (err) {
    res.status(500).json({ error: "Could not send OTP", details: err.message });
  }
});

// POST /api/auth/forgot-password/reset-with-otp
router.post("/forgot-password/reset-with-otp", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res
        .status(400)
        .json({ error: "email, otp, and newPassword are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+resetOtpHash +resetOtpExpires",
    );
    if (!user)
      return res.status(400).json({ error: "Invalid or expired code" });

    const valid = await user.checkResetOtp(otp);
    if (!valid)
      return res.status(400).json({ error: "Invalid or expired code" });

    await user.setPassword(newPassword);
    user.clearResetOtp();
    await user.save();

    res.json({ message: "Password reset successfully — you can now sign in" });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Could not reset password", details: err.message });
  }
});

module.exports = router;
