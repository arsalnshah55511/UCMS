import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
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

export default function StudentDashboard() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    api
      .get("/complain")
      .then(({ data }) => setComplaints(data.complaints))
      .catch((err) => setError(err.response?.data?.message || "Could not load complaints"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () => (statusFilter === "All" ? complaints : complaints.filter((c) => c.status === statusFilter)),
    [complaints, statusFilter]
  );

  const counts = useMemo(() => {
    const c = { Pending: 0, "In-Process": 0, Resolved: 0, Rejected: 0 };
    complaints.forEach((x) => (c[x.status] = (c[x.status] || 0) + 1));
    return c;
  }, [complaints]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-6 py-10">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-amber-600">
              My Complaints
            </p>
            <h1 className="mt-2 font-serif text-4xl font-bold text-slate-900">
              Welcome, {user.name.split(" ")[0]}
            </h1>
          </div>

          <Link
            to="/complaints/new"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 font-medium text-white shadow-sm transition hover:bg-amber-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Complaint
          </Link>
        </div>

        {/* Statistics */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {COMPLAINT_STATUS_LIST.map((s) => (
            <div
              key={s}
              className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm"
            >
              <h2 className={`font-serif text-3xl font-bold ${STATUS_ACCENT[s] || "text-slate-800"}`}>
                {counts[s] || 0}
              </h2>
              <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {s}
              </p>
            </div>
          ))}
        </div>

        {/* Filter Buttons */}
        <div className="mb-6 flex flex-wrap gap-2">
          {["All", ...COMPLAINT_STATUS_LIST].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                statusFilter === s
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:border-amber-400 hover:text-amber-700"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && <Spinner label="Loading complaints" />}

        {/* Error */}
        {error && (
          <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-700">
            {error}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filtered.length === 0 && (
          <EmptyState
            title="No complaints here yet"
            subtitle="Submit one and UCMS will read it, correct it, and route it to the right department automatically."
            action={
              <Link
                to="/complaints/new"
                className="inline-block rounded-xl bg-slate-900 px-5 py-3 text-white transition hover:bg-amber-600"
              >
                Submit a Complaint
              </Link>
            }
          />
        )}

        {/* Complaint Cards */}
        <div className="flex flex-col gap-3">
          {filtered.map((c) => (
            <ComplaintCard key={c._id} complaint={c} />
          ))}
        </div>
      </div>
    </div>
  );
}