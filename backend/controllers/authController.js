const asyncHandler = require("express-async-handler");
const crypto = require("crypto");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const sendEmail = require("../utils/sendEmail");
const { ROLE_LIST, SUBMITTER_ROLES, STAFF_ROLES, REGISTERABLE_STAFF_ROLES, DEPARTMENT_LIST } = require("../config/roles");

/**
 * @desc    Register a new user (student/faculty self-register;
 *          staff roles are typically created by a VC/admin via createStaffUser)
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, rollNumber, phone } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Name, email, and password are required");
  }

  // Public self-registration is restricted to student/faculty.
  // Staff accounts (hod/vc) must be created by an existing VC.
  const requestedRole = SUBMITTER_ROLES.includes(role) ? role : "student";

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    res.status(400);
    throw new Error("A user with this email already exists");
  }

  const user = await User.create({
    name,
    email,
    password,
    role: requestedRole,
    rollNumber: requestedRole === "student" ? rollNumber : undefined,
    phone,
  });

  res.status(201).json({
    success: true,
    user,
    token: generateToken(user),
  });
});

/**
 * @desc    Create a staff account (hod / vc only)
 * @route   POST /api/auth/staff
 * @access  Private (VC only)
 */
const createStaffUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, department, phone } = req.body;

  if (!REGISTERABLE_STAFF_ROLES.includes(role)) {
    res.status(400);
    throw new Error(`Role must be one of: ${REGISTERABLE_STAFF_ROLES.join(", ")}`);
  }

  if (role !== "vc" && !DEPARTMENT_LIST.includes(department)) {
    res.status(400);
    throw new Error(`Department must be one of: ${DEPARTMENT_LIST.join(", ")}`);
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    res.status(400);
    throw new Error("A user with this email already exists");
  }

  const user = await User.create({
    name,
    email,
    password,
    role,
    department: role === "vc" ? null : department,
    phone,
  });

  res.status(201).json({ success: true, user });
});

/**
 * @desc    Log in and receive a JWT
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Email and password are required");
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");

  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  if (!user.isActive) {
    res.status(403);
    throw new Error("This account has been deactivated. Contact the administrator.");
  }

  res.json({
    success: true,
    user,
    token: generateToken(user),
  });
});

/**
 * @desc    Get the currently logged-in user's profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user });
});

/**
 * @desc    Update own profile (name/phone only - not role/email)
 * @route   PUT /api/auth/me
 * @access  Private
 */
const updateMe = asyncHandler(async (req, res) => {
  const { name, phone } = req.body;

  if (name) req.user.name = name;
  if (phone) req.user.phone = phone;

  await req.user.save();
  res.json({ success: true, user: req.user });
});

/**
 * @desc    Change own password
 * @route   PUT /api/auth/change-password
 * @access  Private
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select("+password");
  if (!(await user.matchPassword(currentPassword))) {
    res.status(401);
    throw new Error("Current password is incorrect");
  }

  user.password = newPassword;
  await user.save();

  res.json({ success: true, message: "Password updated successfully" });
});

/**
 * @desc    Request a password reset email. Always responds with the same
 *          generic message whether or not the email exists, so this
 *          endpoint can't be used to check which emails are registered.
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error("Email is required");
  }

  const genericMessage =
    "If an account exists for that email, a password reset link has been sent.";

  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    // Same response as the success case — don't reveal whether the
    // email is registered.
    return res.json({ success: true, message: genericMessage });
  }

  // Generate a random token, email the raw version, but only ever store
  // its hash — so a database leak alone can't be used to reset passwords.
  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 minutes
  await user.save({ validateBeforeSave: false });

  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  const resetUrl = `${clientUrl}/reset-password/${rawToken}`;

  try {
    await sendEmail({
      to: user.email,
      subject: "UCMS — Reset Your Password",
      html: `
        <p>Hi ${user.name},</p>
        <p>Someone requested a password reset for your UCMS account. If this was you, click below to choose a new password. This link expires in 30 minutes.</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>If you didn't request this, you can safely ignore this email — your password won't be changed.</p>
      `,
    });
  } catch (err) {
    // Log the real cause (wrong credentials, blocked port, etc.) — the
    // response to the client stays generic on purpose, but we need this
    // in the server logs to actually diagnose SMTP failures.
    console.error("[forgotPassword] sendEmail failed:", err);

    // Don't leave the account in a state where the token exists but the
    // user never received a way to use it.
    user.resetPasswordToken = null;
    user.resetPasswordExpire = null;
    await user.save({ validateBeforeSave: false });

    res.status(500);
    throw new Error("Could not send reset email. Please try again shortly.");
  }

  res.json({ success: true, message: genericMessage });
});

/**
 * @desc    Reset a password using the token emailed by forgotPassword.
 * @route   PUT /api/auth/reset-password/:token
 * @access  Public
 */
const resetPassword = asyncHandler(async (req, res) => {
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    res.status(400);
    throw new Error("A new password of at least 6 characters is required");
  }

  const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  }).select("+resetPasswordToken +resetPasswordExpire");

  if (!user) {
    res.status(400);
    throw new Error("This reset link is invalid or has expired");
  }

  user.password = newPassword;
  user.resetPasswordToken = null;
  user.resetPasswordExpire = null;
  await user.save();

  res.json({
    success: true,
    message: "Password updated — you can now log in with your new password",
  });
});

module.exports = {
  registerUser,
  createStaffUser,
  loginUser,
  getMe,
  updateMe,
  changePassword,
  forgotPassword,
  resetPassword,
};