const asyncHandler = require("express-async-handler");
const Notification = require("../models/Notification");

/**
 * @desc    Get the logged-in user's notifications, most recent first
 * @route   GET /api/notifications
 * @access  Private
 */
const getMyNotifications = asyncHandler(async (req, res) => {

    const notifications = await Notification.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .limit(50);

    res.json({
        success: true,
        notifications
    });

});

/**
 * @desc    Mark a single notification as read
 * @route   PUT /api/notifications/:id/read
 * @access  Private
 */
const markNotificationRead = asyncHandler(async (req, res) => {

    const notification = await Notification.findById(req.params.id);

    if (!notification) {
        res.status(404);
        throw new Error("Notification not found");
    }

    if (notification.user.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error("Not authorized to update this notification");
    }

    notification.isRead = true;
    await notification.save();

    res.json({
        success: true,
        notification
    });

});

module.exports = {
    getMyNotifications,
    markNotificationRead
};