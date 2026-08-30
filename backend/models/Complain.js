const mongoose = require("mongoose")
const { DEPARTMENT_LIST, COMPLAINT_STATUS, COMPLAINT_STATUS_LIST } = require("../config/roles");


const historyEntrySchema = new mongoose.Schema(
  {
    status: { type: String, enum: COMPLAINT_STATUS_LIST, required: true },
    note: { type: String, trim: true, default: "" },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    changedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const attachmentSchema = new mongoose.Schema(
  {
    fileName: { type: String, required: true },
    filePath: { type: String, required: true }, // relative path served via /uploads
    mimeType: { type: String },
    size: { type: Number },
  },
  { _id: false }
);


const complaintSchema = new mongoose.Schema(
  {
    // What the user actually typed
    originalText: {
      type: String,
      required: [true, "Complaint description is required"],
      trim: true,
      maxlength: 5000,
    },
    // AI spelling/grammar-corrected version, used everywhere in the UI
    correctedText: {
      type: String,
      trim: true,
      default: "",
    },

     image: {
    type: String,
    default: null,
  },
  
    title: {
      type: String,
      required: [true, "Complaint title is required"],
      trim: true,
      maxlength: 150,
    },
    department: {
      type: String,
      enum: DEPARTMENT_LIST,
      required: true,
    },
    // How the department was chosen: the AI classifier (with reasonable
    // confidence), the AI classifier despite low confidence (flagged for
    // staff review), or a manual override
    routingSource: {
      type: String,
      enum: ["ai", "ai-low-confidence", "manual"],
      default: "ai",
    },
    aiConfidence: {
      type: Number, // 0-1, confidence score returned by the classifier
      default: null,
    },
    status: {
      type: String,
      enum: COMPLAINT_STATUS_LIST,
      default: COMPLAINT_STATUS.PENDING,
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Urgent"],
      default: "Medium",
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    attachments: [attachmentSchema],
    history: [historyEntrySchema],
    resolutionNote: {
      type: String,
      trim: true,
      default: "",
    },
    isEscalated: {
      type: Boolean,
      default: false,
    },
    // How many times the submitter has reopened this complaint after it
    // was marked Resolved.
    reopenCount: {
      type: Number,
      default: 0,
    },
    // Other complaints judged similar by the duplicate-detection stage
    // (TF-IDF + cosine similarity), linked both ways.
    relatedComplaints: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Complaint",
      default: [],
    }],
  },
  { timestamps: true }
);

complaintSchema.index({ submittedBy: 1, createdAt: -1 });
complaintSchema.index({ department: 1, status: 1 });

module.exports = mongoose.model("Complaint", complaintSchema);