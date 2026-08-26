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

module.exports = router;