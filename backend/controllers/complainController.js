const asyncHandler= require("express-async-handler")
const Complaint  = require("../models/Complain")
const Notification = require("../models/Notification")
const {analyzeComplaint} = require("../utils/spellCorrector")
const {generateInsights} = require("../utils/insights")
const {
     ROLES,
  DEPARTMENT_LIST,
  DEPARTMENT_HANDLER_ROLE,
  COMPLAINT_STATUS,
} = require("../config/roles")

/**
 * Builds the MongoDB filter that scopes which complaints a given user
 * is allowed to see, based on their role.
 */

const buildScopeFilter =  (user)=>{
    if(user.role === ROLES.STUDENT || user.role === ROLES.FACULTY){
        return {submittedBy : user._id}
    }
    if(user.role === ROLES.VC){
        return {}
    }
     // hod / admin_office / provost only see complaints for their department
     return {department :user.department}
}

/**
 * @desc    Submit a new complaint. Runs the text through spell-correction
 *          and department classification, then creates the complaint
 *          already routed.
 * @route   POST /api/complaints
 * @access  Private (student, faculty)
 */

const createComplaint = asyncHandler(async (req, res) => {

    const { title, originalText } = req.body;

    const image = req.file ? `/uploads/${req.file.filename}` : null;

    if (!title || !originalText) {
        res.status(400);
        throw new Error("Please enter title and complaint");
    }

    // AI
    const aiResult = await analyzeComplaint(title, originalText);

    // Save Complaint
    const complaint = await Complaint.create({

        title,

        originalText,

        correctedText: aiResult.correctedText,

        department: aiResult.department,

        routingSource: "ai",

        aiConfidence: aiResult.confidence,

        priority: aiResult.priority,

        submittedBy: req.user._id,

        image,

        history: [{
            status: COMPLAINT_STATUS.PENDING,
            note: "Complaint submitted",
            changedBy: req.user._id
        }]
    });

    res.status(201).json({
        success: true,
        complaint
    });

});

const getComplaints = asyncHandler(async (req, res) => {

    const filter = buildScopeFilter(req.user);

    const complaints = await Complaint.find(filter)
        .populate("submittedBy", "name email role")
        .sort({ createdAt: -1 });

    res.json({
        success: true,
        complaints
    });

});

const getComplaintById = asyncHandler(async (req, res) => {

    const complaint = await Complaint.findById(req.params.id)
        .populate("submittedBy", "name email role")
        .populate("assignedTo", "name email role");

    if (!complaint) {
        res.status(404);
        throw new Error("Complaint not found");
    }

    const isOwner = complaint.submittedBy._id.toString() === req.user._id.toString();
    const isVC = req.user.role === ROLES.VC;
    const isSameDepartment = complaint.department === req.user.department;

    if (!isOwner && !isVC && !isSameDepartment) {
        res.status(403);
        throw new Error("Not authorized to view this complaint");
    }

    res.json({
        success: true,
        complaint
    });

});


const updateComplaintStatus = asyncHandler(async (req, res) => {

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
        res.status(404);
        throw new Error("Complaint not found");
    }

    // VC can update anything; everyone else only their own department
    if (req.user.role !== ROLES.VC && complaint.department !== req.user.department) {
        res.status(403);
        throw new Error("Not authorized to update complaints outside your department");
    }

    complaint.status = req.body.status;

    complaint.history.push({

        status: req.body.status,

        note: req.body.note || "",

        changedBy: req.user._id

    });

    await complaint.save();

    // Notify the complaint's submitter that its status has changed
    await Notification.create({
        user: complaint.submittedBy,
        complaint: complaint._id,
        message: `Your complaint "${complaint.title}" is now ${complaint.status}.`,
        type: "status_update",
    });

    res.json({

        success: true,

        complaint

    });

});

/**
 * @desc    Reassign a complaint to a different department. Used to correct
 *          a complaint that the AI classifier routed incorrectly.
 * @route   PUT /api/complaints/:id/department
 * @access  Private (VC only)
 */
const reassignDepartment = asyncHandler(async (req, res) => {

    const { department } = req.body;

    if (!DEPARTMENT_LIST.includes(department)) {
        res.status(400);
        throw new Error(`Department must be one of: ${DEPARTMENT_LIST.join(", ")}`);
    }

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
        res.status(404);
        throw new Error("Complaint not found");
    }

    const previousDepartment = complaint.department;

    if (previousDepartment === department) {
        res.status(400);
        throw new Error("Complaint is already assigned to this department");
    }

    complaint.department = department;
    complaint.routingSource = "manual";

    complaint.history.push({
        status: complaint.status,
        note: `Reassigned from ${previousDepartment} to ${department}`,
        changedBy: req.user._id
    });

    await complaint.save();

    res.json({
        success: true,
        complaint
    });

});

/**
 * @desc    Returns a plain-English AI-generated summary of complaint
 *          trends across all departments (volume trend, top departments,
 *          unresolved high-priority backlog).
 * @route   GET /api/complaints/insights
 * @access  Private (VC only)
 */
const getInsights = asyncHandler(async (req, res) => {

    const complaints = await Complaint.find({}).select("department status priority createdAt");

    const insights = generateInsights(complaints);

    res.json({
        success: true,
        insights
    });

});


module.exports = {

    createComplaint,

    getComplaints,

    getComplaintById,

    updateComplaintStatus,

    reassignDepartment,

    getInsights

};