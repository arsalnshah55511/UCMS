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
  bulkUpdateStatus,
  bulkReassignDepartment,
  getInsights,
  submitFeedback,
  getFeedback,
  reopenComplaint,
  deleteComplaint,
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


router.get("/insights", protect, authorize(ROLES.VC), getInsights);

// IMPORTANT: both bulk routes must be declared BEFORE "/:id/status" and
// "/:id/department" below. Both pairs have the same two-segment shape
// (e.g. "/bulk/status" vs "/:id/status"), so if "/:id/status" were matched
// first, Express would treat "bulk" as the :id parameter and route bulk
// requests into the single-complaint controller by mistake.
router.put(
    "/bulk/status",
    protect,
    authorize(
        ROLES.HOD,
        ROLES.ADMIN_OFFICE,
        ROLES.PROVOST,
        ROLES.VC
    ),
    bulkUpdateStatus
);

router.put(
    "/bulk/department",
    protect,
    authorize(ROLES.VC),
    bulkReassignDepartment
);

router.get("/:id", protect, getComplaintById);

// No role restriction beyond student/faculty — the controller checks that
// the requester actually owns this specific complaint and that it's
// still Pending.
router.delete(
    "/:id",
    protect,
    authorize(ROLES.STUDENT, ROLES.FACULTY),
    deleteComplaint
);

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
    // VC can always reassign; the controller itself further restricts
    // non-VC staff to only their own department's low-confidence-routed
    // complaints — see reassignDepartment.
    authorize(
        ROLES.HOD,
        ROLES.ADMIN_OFFICE,
        ROLES.PROVOST,
        ROLES.VC
    ),
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