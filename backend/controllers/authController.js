const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");
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

module.exports = {
  registerUser,
  createStaffUser,
  loginUser,
  getMe,
  updateMe,
  changePassword,
};