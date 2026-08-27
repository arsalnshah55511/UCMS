import React, { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import ComplaintCard from "../components/ComplaintCard";
import Spinner from "../components/Spinner";
import EmptyState from "../components/EmptyState";
import { COMPLAINT_STATUS_LIST } from "../utils/constants";

const STATUS_ACCENT = {
  Pending: "text-amber-600",
  "In-Process": "text-blue-600",
  Resolved: "text-emerald-600",
  Rejected: "text-rose-600",
};

const STATUS_ICON = {
  Pending: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  "In-Process": (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
  Resolved: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Rejected: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
    </svg>
  ),
};

export default function StaffDashboard() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [insights, setInsights] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(false);

  useEffect(() => {
    api
   .get("/api/complain")
      .then(({ data }) => setComplaints(data.complaints))
      .catch((err) => setError(err.response?.data?.message || "Could not load complaints"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (user.role !== "vc") return;

    setInsightsLoading(true);
    api
      .get("/api/complain/insights")
      .then(({ data }) => setInsights(data.insights))
      .catch(() => setInsights(null))
      .finally(() => setInsightsLoading(false));
  }, [user.role]);

  const filtered = useMemo(
    () =>
      statusFilter === "All"
        ? complaints
        : complaints.filter((c) => c.status === statusFilter),
    [complaints, statusFilter]
  );

  const counts = useMemo(() => {
    const c = {
      Pending: 0,
      "In-Process": 0,
      Resolved: 0,
      Rejected: 0,
    };

    complaints.forEach((x) => (c[x.status] = (c[x.status] || 0) + 1));

    return c;
  }, [complaints]);

  const scopeLabel = user.role === "vc" ? "All Departments" : user.department;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Institutional top accent bar */}
      <div className="h-1.5 w-full bg-gradient-to-r from-slate-900 via-amber-600 to-slate-900" />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-start justify-between gap-6 border-b border-slate-200 pb-6">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-amber-500/40 bg-slate-900 font-serif text-xl font-bold text-amber-400">
              {scopeLabel.charAt(0)}
            </div>
            <div>
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-amber-600">
                {scopeLabel}
              </p>
              <h1 className="mt-1 font-serif text-4xl font-bold leading-tight text-slate-900">
                Complaint Queue
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                {user.role === "vc"
                  ? "System-wide view across every department"
                  : "Complaints routed to your department"}
              </p>
            </div>
          </div>

          <div className="shrink-0 rounded-2xl border border-slate-200 bg-white px-6 py-4 text-center shadow-sm">
            <p className="font-serif text-3xl font-bold text-slate-900">{complaints.length}</p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              Total Complaints
            </p>
          </div>
        </div>

        {/* AI Insights — VC only */}
        {user.role === "vc" && (
          <div className="mb-8 overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-slate-900 to-slate-800 p-6 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">
                AI Insights
              </p>
            </div>

            {insightsLoading && (
              <p className="text-sm text-slate-300">Analyzing complaint trends...</p>
            )}

            {!insightsLoading && insights && (
              <p className="font-serif text-lg leading-relaxed text-white">
                {insights.summary}
              </p>
            )}

            {!insightsLoading && !insights && (
              <p className="text-sm text-slate-400">Insights unavailable right now.</p>
            )}
          </div>
        )}

        {/* Stat cards */}
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {COMPLAINT_STATUS_LIST.map((s) => (
            <div
              key={s}
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className={`rounded-lg bg-slate-50 p-2 ${STATUS_ACCENT[s] || "text-slate-800"}`}>
                  {STATUS_ICON[s]}
                </span>
                <h2 className={`font-serif text-3xl font-bold ${STATUS_ACCENT[s] || "text-slate-800"}`}>
                  {counts[s] || 0}
                </h2>
              </div>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {s}
              </p>
            </div>
          ))}
        </div>

        {/* Filter pills */}
        <div className="mb-6 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
          {["All", ...COMPLAINT_STATUS_LIST].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition duration-200 ${
                statusFilter === s
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-50 hover:text-amber-700"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {loading && <Spinner label="Loading queue" />}

        {error && (
          <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-700">
            {error}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <EmptyState
            title="Queue is empty"
            subtitle="Nothing here matches this filter right now."
          />
        )}

        <div className="flex flex-col gap-3">
          {filtered.map((c) => (
            <ComplaintCard key={c._id} complaint={c} showSubmitter />
          ))}
        </div>
      </div>
    </div>
  );
}