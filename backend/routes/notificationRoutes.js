const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
    getMyNotifications,
    markNotificationRead
} = require("../controllers/notificationController");

router.get("/", protect, getMyNotifications);

router.put("/:id/read", protect, markNotificationRead);

module.exports = router;