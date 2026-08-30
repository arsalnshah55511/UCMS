import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import RoutingStamp from "../components/RoutingStamp";
import StatusBadge from "../components/StatusBadge";
import Spinner from "../components/Spinner";

import { COMPLAINT_STATUS_LIST, DEPARTMENTS } from "../utils/constants";

const API_ORIGIN = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");

function formatDateTime(dateStr) {
  return new Date(dateStr).toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Star({ filled, onClick, onMouseEnter, onMouseLeave, interactive }) {
  return (
    <svg
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className={`h-7 w-7 ${interactive ? "cursor-pointer" : ""} ${
        filled ? "fill-amber-500 text-amber-500" : "fill-none text-slate-300"
      }`}
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 21.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
      />
    </svg>
  );
}

export default function ComplaintDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isStaff, user } = useAuth();

  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [nextStatus, setNextStatus] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [nextDepartment, setNextDepartment] = useState("");
  const [reassigning, setReassigning] = useState(false);
  const [reassignError, setReassignError] = useState("");

  // Feedback state
  const [feedback, setFeedback] = useState(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [ratingInput, setRatingInput] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [commentInput, setCommentInput] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackError, setFeedbackError] = useState("");

  // Reopen state
  const [showReopenForm, setShowReopenForm] = useState(false);
  const [reopenReason, setReopenReason] = useState("");
  const [reopening, setReopening] = useState(false);
  const [reopenError, setReopenError] = useState("");

  // Delete state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const load = () => {
    setLoading(true);
    api
      .get(`/api/complain/${id}`)
      .then(({ data }) => {
        setComplaint(data.complaint);
        setNextStatus(data.complaint.status);
        setNextDepartment(data.complaint.department);
      })
      .catch((err) => setError(err.response?.data?.message || "Could not load complaint"))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  // Once we know the complaint is Resolved, check whether feedback already exists
  useEffect(() => {
    if (!complaint || complaint.status !== "Resolved") return;

    setFeedbackLoading(true);
    api
      .get(`/api/complain/${id}/feedback`)
      .then(({ data }) => setFeedback(data.feedback))
      .catch(() => setFeedback(null))
      .finally(() => setFeedbackLoading(false));
  }, [complaint?.status, id]);

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    setSaveError("");
    setSaving(true);
    try {
      const { data } = await api.put(`/api/complain/${id}/status`, {
        status: nextStatus,
        note,
      });
      setComplaint(data.complaint);
      setNote("");
    } catch (err) {
      setSaveError(err.response?.data?.message || "Could not update status");
    } finally {
      setSaving(false);
    }
  };

  const handleReassign = async (e) => {
    e.preventDefault();
    setReassignError("");
    setReassigning(true);
    try {
      const { data } = await api.put(`/api/complain/${id}/department`, {
        department: nextDepartment,
      });
      setComplaint(data.complaint);
    } catch (err) {
      setReassignError(err.response?.data?.message || "Could not reassign department");
    } finally {
      setReassigning(false);
    }
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    setFeedbackError("");

    if (ratingInput < 1) {
      setFeedbackError("Please select a star rating before submitting");
      return;
    }

    setSubmittingFeedback(true);
    try {
      const { data } = await api.post(`/api/complain/${id}/feedback`, {
        rating: ratingInput,
        comment: commentInput,
      });
      setFeedback(data.feedback);
    } catch (err) {
      setFeedbackError(err.response?.data?.message || "Could not submit feedback");
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleReopen = async (e) => {
    e.preventDefault();
    setReopenError("");

    if (!reopenReason.trim()) {
      setReopenError("Please explain why you're reopening this complaint");
      return;
    }

    setReopening(true);
    try {
      const { data } = await api.put(`/api/complain/${id}/reopen`, {
        reason: reopenReason,
      });
      setComplaint(data.complaint);
      setShowReopenForm(false);
      setReopenReason("");
      // Status is now back to Pending, so the Feedback section will hide
      // itself automatically — no need to clear feedback state manually.
    } catch (err) {
      setReopenError(err.response?.data?.message || "Could not reopen complaint");
    } finally {
      setReopening(false);
    }
  };

  const handleDelete = async () => {
    setDeleteError("");
    setDeleting(true);
    try {
      await api.delete(`/api/complain/${id}`);
      // The complaint no longer exists, so navigate back to the list
      // rather than trying to re-render this page.
      navigate(isStaff ? "/staff" : "/dashboard");
    } catch (err) {
      setDeleteError(err.response?.data?.message || "Could not delete complaint");
      setDeleting(false);
    }
  };

  if (loading) return <Spinner label="Loading complaint" />;

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16 text-center">
        <p className="text-rose-600">{error}</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 rounded-xl bg-slate-200 px-5 py-2 transition hover:bg-slate-300"
        >
          Go Back
        </button>
      </div>
    );
  }

  const isOwner = complaint.submittedBy?._id === user._id;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <Link
          to={isStaff ? "/staff" : "/dashboard"}
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-amber-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to {isStaff ? "Queue" : "My Complaints"}
        </Link>

        {/* Case summary */}
        <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-slate-900 px-6 py-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-amber-400">
              Case File
            </p>
          </div>

          <div className="p-6">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <RoutingStamp department={complaint.department} />

                <div>
                  <p className="font-mono text-xs text-slate-400">
                    #{complaint._id.slice(-6).toUpperCase()} · {formatDateTime(complaint.createdAt)}
                  </p>
                  <h1 className="mt-1 font-serif text-3xl font-bold text-slate-900">
                    {complaint.title}
                  </h1>
                </div>
              </div>

              <StatusBadge status={complaint.status} />
            </div>

            <div className="mb-6 grid grid-cols-1 gap-5 border-t border-slate-100 pt-5 md:grid-cols-2">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Department
                </h3>
                <p className="mt-1 text-slate-800">{complaint.department}</p>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Priority
                </h3>
                <p className="mt-1 text-slate-800">{complaint.priority}</p>
              </div>

              {complaint.submittedBy?.name && (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Submitted By
                  </h3>
                  <p className="mt-1 text-slate-800">{complaint.submittedBy.name}</p>
                </div>
              )}

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Routing
                </h3>
                <p className="mt-1 text-slate-800">
                  {complaint.routingSource === "ai" ? "Auto-routed by AI" : "Manually Assigned"}
                </p>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-5">
              <h3 className="mb-2 font-serif text-lg font-semibold text-slate-900">Complaint</h3>

              <p className="whitespace-pre-wrap leading-7 text-slate-700">
                {complaint.correctedText || complaint.originalText}
              </p>

              {complaint.correctedText && complaint.correctedText !== complaint.originalText && (
                <details className="mt-4 rounded-xl bg-slate-50 p-3">
                  <summary className="cursor-pointer text-sm font-medium text-amber-700">
                    View Original Text
                  </summary>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
                    {complaint.originalText}
                  </p>
                </details>
              )}
            </div>

            {complaint.status === "Resolved" && complaint.resolutionNote && (
              <div className="mt-5 border-t border-slate-100 pt-5">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <h3 className="mb-1 font-serif text-lg font-semibold text-emerald-800">
                    Resolution
                  </h3>
                  <p className="whitespace-pre-wrap leading-7 text-emerald-900">
                    {complaint.resolutionNote}
                  </p>
                </div>
              </div>
            )}

            {complaint.image && (
              <div className="mt-5 border-t border-slate-100 pt-5">
                <h3 className="mb-3 font-serif text-lg font-semibold text-slate-900">Attachment</h3>
                <img
                  src={`${API_ORIGIN}${complaint.image}`}
                  alt="Complaint attachment"
                  className="max-h-72 rounded-xl border border-slate-200 object-cover"
                />
              </div>
            )}
          </div>
        </div>

        {/* Department reassignment (VC only) */}
        {user.role === "vc" && (
          <form
            onSubmit={handleReassign}
            className="mb-6 space-y-4 rounded-2xl border border-amber-200 bg-amber-50/50 p-6 shadow-sm"
          >
            <div>
              <h2 className="font-serif text-xl font-semibold text-slate-900">
                Reassign Department
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Use this if the AI routed this complaint to the wrong department.
              </p>
            </div>

            {reassignError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-rose-700">
                {reassignError}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <select
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                value={nextDepartment}
                onChange={(e) => setNextDepartment(e.target.value)}
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>

              <button
                type="submit"
                disabled={reassigning || nextDepartment === complaint.department}
                className="rounded-xl bg-amber-600 py-2 font-medium text-white transition hover:bg-amber-700 disabled:bg-slate-300"
              >
                {reassigning ? "Reassigning..." : "Reassign"}
              </button>
            </div>
          </form>
        )}

        {/* History timeline */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 font-serif text-xl font-semibold text-slate-900">History</h2>

          <ol className="space-y-5">
            {[...complaint.history].reverse().map((h, i) => (
              <li key={i} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500 ring-4 ring-amber-100" />
                  {i < complaint.history.length - 1 && (
                    <span className="mt-1 w-px flex-1 bg-slate-200" />
                  )}
                </div>

                <div className="pb-1">
                  <p className="font-medium text-slate-800">
                    {h.status}
                    {h.note ? ` — ${h.note}` : ""}
                  </p>
                  <p className="mt-0.5 text-sm text-slate-400">{formatDateTime(h.changedAt)}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Delete — only the submitter, only while still Pending */}
        {isOwner && complaint.status === "Pending" && (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50/40 p-6 shadow-sm">
            {!showDeleteConfirm ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-serif text-lg font-semibold text-slate-900">
                    Submitted this by mistake?
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    You can delete this complaint while it's still Pending.
                  </p>
                </div>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="shrink-0 rounded-xl border border-rose-300 px-4 py-2 text-sm font-medium text-rose-700 transition hover:border-rose-400 hover:bg-rose-100"
                >
                  Delete Complaint
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h2 className="font-serif text-lg font-semibold text-slate-900">
                    Delete this complaint?
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    This cannot be undone.
                  </p>
                </div>

                {deleteError && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-rose-700">
                    {deleteError}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="rounded-xl bg-rose-600 px-5 py-2 font-medium text-white transition hover:bg-rose-700 disabled:bg-slate-300"
                  >
                    {deleting ? "Deleting..." : "Confirm Delete"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteError("");
                    }}
                    className="rounded-xl px-5 py-2 text-sm font-medium text-slate-500 transition hover:text-slate-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Feedback — only relevant once the complaint is Resolved */}
        {complaint.status === "Resolved" && (
          <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 font-serif text-xl font-semibold text-slate-900">Feedback</h2>

            {feedbackLoading && <p className="text-sm text-slate-500">Loading feedback...</p>}

            {!feedbackLoading && feedback && (
              // Already submitted — read-only view, visible to submitter and staff alike
              <div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star key={n} filled={n <= feedback.rating} interactive={false} />
                  ))}
                </div>
                {feedback.comment && (
                  <p className="mt-3 whitespace-pre-wrap leading-6 text-slate-700">
                    {feedback.comment}
                  </p>
                )}
                <p className="mt-3 text-sm text-slate-400">
                  Submitted {formatDateTime(feedback.createdAt)}
                </p>
              </div>
            )}

            {!feedbackLoading && !feedback && isOwner && (
              // Submitter hasn't rated yet — show the form
              <form onSubmit={handleSubmitFeedback} className="space-y-4">
                <p className="text-sm text-slate-500">
                  How was your experience with this complaint's resolution?
                </p>

                {feedbackError && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-rose-700">
                    {feedbackError}
                  </div>
                )}

                <div className="flex items-center gap-1" onMouseLeave={() => setHoverRating(0)}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      filled={n <= (hoverRating || ratingInput)}
                      interactive
                      onClick={() => setRatingInput(n)}
                      onMouseEnter={() => setHoverRating(n)}
                    />
                  ))}
                </div>

                <textarea
                  rows={3}
                  placeholder="Add a comment (optional)"
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />

                <button
                  type="submit"
                  disabled={submittingFeedback}
                  className="rounded-xl bg-slate-900 px-5 py-2 font-medium text-white transition hover:bg-amber-600 disabled:bg-slate-300"
                >
                  {submittingFeedback ? "Submitting..." : "Submit Feedback"}
                </button>
              </form>
            )}

            {!feedbackLoading && !feedback && !isOwner && (
              // Staff/VC viewing before the submitter has rated
              <p className="text-sm text-slate-400">No feedback submitted yet.</p>
            )}
          </div>
        )}

        {/* Reopen — only the submitter, only once Resolved */}
        {complaint.status === "Resolved" && isOwner && (
          <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            {!showReopenForm ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-serif text-lg font-semibold text-slate-900">
                    Not satisfied with this resolution?
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    You can reopen this complaint instead of submitting a new one.
                  </p>
                </div>
                <button
                  onClick={() => setShowReopenForm(true)}
                  className="shrink-0 rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-amber-400 hover:text-amber-700"
                >
                  Reopen Complaint
                </button>
              </div>
            ) : (
              <form onSubmit={handleReopen} className="space-y-4">
                <div>
                  <h2 className="font-serif text-lg font-semibold text-slate-900">
                    Reopen Complaint
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Let the department know why this needs another look.
                  </p>
                </div>

                {reopenError && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-rose-700">
                    {reopenError}
                  </div>
                )}

                <textarea
                  rows={3}
                  placeholder="Reason for reopening (required)"
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={reopening}
                    className="rounded-xl bg-slate-900 px-5 py-2 font-medium text-white transition hover:bg-amber-600 disabled:bg-slate-300"
                  >
                    {reopening ? "Reopening..." : "Confirm Reopen"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowReopenForm(false);
                      setReopenError("");
                    }}
                    className="rounded-xl px-5 py-2 text-sm font-medium text-slate-500 transition hover:text-slate-700"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Status update (staff only) */}
        {isStaff && (
          <form
            onSubmit={handleStatusUpdate}
            className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h2 className="font-serif text-xl font-semibold text-slate-900">Update Status</h2>

            {saveError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-rose-700">
                {saveError}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <select
                className="rounded-xl border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                value={nextStatus}
                onChange={(e) => setNextStatus(e.target.value)}
              >
                {COMPLAINT_STATUS_LIST.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>

              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-slate-900 py-2 font-medium text-white transition hover:bg-amber-600 disabled:bg-slate-300"
              >
                {saving ? "Saving..." : "Save Status"}
              </button>
            </div>

            <textarea
              rows={3}
              placeholder="Add a note (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </form>
        )}
      </div>
    </div>
  );
}