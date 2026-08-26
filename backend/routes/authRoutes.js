const express = require("express");
const {
  registerUser,
  createStaffUser,
  loginUser,
  getMe,
  updateMe,
  changePassword,
} = require("../controllers/authController");
const { protect } = require("../middleware/auth");
 const { authorize } = require("../middleware/roleCheck");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
//  router.post("/staff", protect, authorize("vc"), createStaffUser);
router.post("/staff", createStaffUser);

router.get("/me", protect, getMe);
router.put("/me", protect, updateMe);
router.put("/change-password", protect, changePassword);

module.exports = router;
