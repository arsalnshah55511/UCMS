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