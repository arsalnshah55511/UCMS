const asyncHandler= require("express-async-handler")
const Complaint  = require("../models/Complain")
const Notification = require("../models/Notification")
const {analyzeComplaint} = require("../utils/spellCorrector")
const {generateInsights} = require("../utils/insights")
const {findSimilarComplaints} = require("../utils/Similarity")
const {
     ROLES,
  DEPARTMENT_LIST,
  DEPARTMENT_HANDLER_ROLE,
  COMPLAINT_STATUS,
  COMPLAINT_STATUS_LIST,
} = require("../config/roles")
const Feedback = require("../models/Feedback")

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

    // Flag likely duplicate/recurring complaints for staff — compares
    // against other open complaints in the same department, any
    // submitter, from the last 90 days. This never changes anything the
    // submitting student sees; it only shows up in the staff queue.
    const similar = await findSimilarComplaints(
        `${title} ${aiResult.correctedText}`,
        aiResult.department,
        Complaint,
        complaint._id
    );

    if (similar.length > 0) {
        complaint.relatedComplaints = similar.map((s) => s.complaint._id);
        await complaint.save();

        await Complaint.updateMany(
            { _id: { $in: similar.map((s) => s.complaint._id) } },
            { $addToSet: { relatedComplaints: complaint._id } }
        );
    }

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

    if (req.body.status === COMPLAINT_STATUS.RESOLVED && req.body.note?.trim()) {
        complaint.resolutionNote = req.body.note.trim();
    }

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
 * @desc    Update the status of multiple complaints in one request.
 *          Complaints outside the caller's department are silently
 *          skipped (rather than failing the whole batch) so a mixed
 *          selection still applies to whatever the staff member is
 *          actually allowed to touch.
 * @route   PUT /api/complaints/bulk/status
 * @access  Private (hod, admin_office, provost, vc)
 */
const bulkUpdateStatus = asyncHandler(async (req, res) => {

    const { ids, status, note } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
        res.status(400);
        throw new Error("Please provide at least one complaint id");
    }

    if (!COMPLAINT_STATUS_LIST.includes(status)) {
        res.status(400);
        throw new Error(`Status must be one of: ${COMPLAINT_STATUS_LIST.join(", ")}`);
    }

    const complaints = await Complaint.find({ _id: { $in: ids } });

    const updatable = req.user.role === ROLES.VC
        ? complaints
        : complaints.filter((c) => c.department === req.user.department);

    for (const complaint of updatable) {

        complaint.status = status;

        if (status === COMPLAINT_STATUS.RESOLVED && note?.trim()) {
            complaint.resolutionNote = note.trim();
        }

        complaint.history.push({
            status,
            note: note || "",
            changedBy: req.user._id,
        });

        await complaint.save();

        await Notification.create({
            user: complaint.submittedBy,
            complaint: complaint._id,
            message: `Your complaint "${complaint.title}" is now ${complaint.status}.`,
            type: "status_update",
        });
    }

    res.json({
        success: true,
        updatedCount: updatable.length,
        skippedCount: complaints.length - updatable.length,
        notFoundCount: ids.length - complaints.length,
    });

});

/**
 * @desc    Reassign multiple complaints to a different department at once.
 * @route   PUT /api/complaints/bulk/department
 * @access  Private (VC only)
 */
const bulkReassignDepartment = asyncHandler(async (req, res) => {

    const { ids, department } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
        res.status(400);
        throw new Error("Please provide at least one complaint id");
    }

    if (!DEPARTMENT_LIST.includes(department)) {
        res.status(400);
        throw new Error(`Department must be one of: ${DEPARTMENT_LIST.join(", ")}`);
    }

    const complaints = await Complaint.find({ _id: { $in: ids } });

    let updatedCount = 0;

    for (const complaint of complaints) {

        if (complaint.department === department) continue;

        const previousDepartment = complaint.department;
        complaint.department = department;
        complaint.routingSource = "manual";

        complaint.history.push({
            status: complaint.status,
            note: `Reassigned from ${previousDepartment} to ${department}`,
            changedBy: req.user._id,
        });

        await complaint.save();
        updatedCount++;
    }

    res.json({
        success: true,
        updatedCount,
        skippedCount: complaints.length - updatedCount,
        notFoundCount: ids.length - complaints.length,
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
const submitFeedback = asyncHandler(async (req, res) => {
 
    const { rating, comment } = req.body;
 
    if (!rating || rating < 1 || rating > 5) {
        res.status(400);
        throw new Error("Rating must be a number between 1 and 5");
    }
 
    const complaint = await Complaint.findById(req.params.id);
 
    if (!complaint) {
        res.status(404);
        throw new Error("Complaint not found");
    }
 
    const isOwner = complaint.submittedBy.toString() === req.user._id.toString();
 
    if (!isOwner) {
        res.status(403);
        throw new Error("Only the complaint's submitter can leave feedback");
    }
 
    if (complaint.status !== COMPLAINT_STATUS.RESOLVED) {
        res.status(400);
        throw new Error("Feedback can only be submitted once a complaint is Resolved");
    }
 
    const existing = await Feedback.findOne({ complaint: complaint._id });
 
    if (existing) {
        res.status(400);
        throw new Error("Feedback has already been submitted for this complaint");
    }
 
    const feedback = await Feedback.create({
        complaint: complaint._id,
        submittedBy: req.user._id,
        rating,
        comment: comment || "",
    });
 
    res.status(201).json({
        success: true,
        feedback
    });
 
});
 
/**
 * @desc    Retrieve the feedback left on a complaint, if any.
 * @route   GET /api/complaints/:id/feedback
 * @access  Private (submitter, same-department staff, or VC — same visibility
 *          rule as viewing the complaint itself)
 */
const getFeedback = asyncHandler(async (req, res) => {
 
    const complaint = await Complaint.findById(req.params.id);
 
    if (!complaint) {
        res.status(404);
        throw new Error("Complaint not found");
    }
 
    const isOwner = complaint.submittedBy.toString() === req.user._id.toString();
    const isVC = req.user.role === ROLES.VC;
    const isSameDepartment = complaint.department === req.user.department;
 
    if (!isOwner && !isVC && !isSameDepartment) {
        res.status(403);
        throw new Error("Not authorized to view feedback for this complaint");
    }
 
    const feedback = await Feedback.findOne({ complaint: complaint._id });
 
    res.json({
        success: true,
        feedback // null if none submitted yet — the frontend should handle this
    });
 
});

/**
 * @desc    Reopen a Resolved complaint that the submitter isn't satisfied
 *          with, instead of forcing them to submit a fresh duplicate.
 *          Requires a reason, and resets the complaint to Pending so it
 *          re-enters the department's active queue.
 * @route   PUT /api/complaints/:id/reopen
 * @access  Private (must be the complaint's original submitter)
 */
const reopenComplaint = asyncHandler(async (req, res) => {

    const { reason } = req.body;

    if (!reason || !reason.trim()) {
        res.status(400);
        throw new Error("A reason is required to reopen a complaint");
    }

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
        res.status(404);
        throw new Error("Complaint not found");
    }

    const isOwner = complaint.submittedBy.toString() === req.user._id.toString();

    if (!isOwner) {
        res.status(403);
        throw new Error("Only the complaint's submitter can reopen it");
    }

    if (complaint.status !== COMPLAINT_STATUS.RESOLVED) {
        res.status(400);
        throw new Error("Only a Resolved complaint can be reopened");
    }

    complaint.status = COMPLAINT_STATUS.PENDING;
    complaint.reopenCount = (complaint.reopenCount || 0) + 1;

    complaint.history.push({
        status: COMPLAINT_STATUS.PENDING,
        note: `Reopened by submitter — reason: ${reason.trim()}`,
        changedBy: req.user._id
    });

    await complaint.save();

    // Note: unlike updateComplaintStatus, this doesn't create a Notification
    // for department staff — your Notification model only supports a single
    // `user` recipient, and there's no existing mechanism in this codebase
    // for notifying "everyone in a department." If you want staff to be
    // alerted when a complaint reopens, that would need either an
    // assignedTo value being reliably set elsewhere first, or a broadcast
    // pattern (one Notification per department staff member).

    res.json({
        success: true,
        complaint
    });

});


module.exports = {

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
    reopenComplaint

    
};