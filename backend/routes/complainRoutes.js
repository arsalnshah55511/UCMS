const express = require("express")
const router = express.Router()
const {protect}=require("../middleware/auth")
const {authorize} =require("../middleware/roleCheck")
const { ROLES } = require("../config/roles");
const {
  createComplaint,
  getComplaints,
  getComplaintById,
  updateComplaintStatus,
  reassignDepartment,
  getInsights,
  submitFeedback,
  getFeedback,
  reopenComplaint,
} = require("../controllers/complainController");

 const upload = require("../middleware/uploads")
 router.post(
    "/",
    protect,
    authorize(ROLES.STUDENT, ROLES.FACULTY),
    upload.single("image"),
    createComplaint
);
 



// router.post("/", protect, authorize(ROLES.STUDENT, ROLES.FACULTY), createComplaint);

router.get("/", protect, getComplaints);

// IMPORTANT: this must be declared BEFORE "/:id" below, or Express will
// try to match "insights" as a complaint ID instead of this route.
router.get("/insights", protect, authorize(ROLES.VC), getInsights);

router.get("/:id", protect, getComplaintById);

router.put(
    "/:id/status",
    protect,
    authorize(
        ROLES.HOD,
        ROLES.ADMIN_OFFICE,
        ROLES.PROVOST,
        ROLES.VC
    ),
    updateComplaintStatus
);

router.put(
    "/:id/department",
    protect,
    authorize(ROLES.VC),
    reassignDepartment
);

// Only the original submitter (student/faculty) can leave feedback —
// the controller additionally checks that they own this specific complaint
// and that it's Resolved.
router.post(
    "/:id/feedback",
    protect,
    authorize(ROLES.STUDENT, ROLES.FACULTY),
    submitFeedback
);

// No role restriction here — the controller itself checks that the
// requester is the submitter, same-department staff, or VC, same as
// getComplaintById above.
router.get(
    "/:id/feedback",
    protect,
    getFeedback
);

// No role restriction beyond student/faculty — the controller checks that
// the requester actually owns this specific complaint and that it's
// currently Resolved.
router.put(
    "/:id/reopen",
    protect,
    authorize(ROLES.STUDENT, ROLES.FACULTY),
    reopenComplaint
);

module.exports = router;