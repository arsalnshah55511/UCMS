import React from "react";
import { Link } from "react-router-dom";
import StatusBadge from "./StatusBadge";
import RoutingStamp from "./RoutingStamp";

const API_ORIGIN = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");

function resolveImageUrl(image) {
  if (!image) return null;
  return image.startsWith("http") ? image : `${API_ORIGIN}${image}`;
}

function ticketNumber(id) {
  return `#${id.slice(-6).toUpperCase()}`;
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// Left-edge tab color by status — a ledger folder-tab cue rather than
// a colored badge doing all the work.
const STATUS_TAB = {
  Pending: "#B08D3E",
  "In-Process": "#3F5F4F",
  Resolved: "#3F5F4F",
  Rejected: "#A6462B",
};

export default function ComplaintCard({
  complaint,
  showSubmitter = false,
  showSimilarFlag = false,
  selectable = false,
  selected = false,
  onToggleSelect,
}) {
  const similarCount = complaint.relatedComplaints?.length || 0;
  const tabColor = STATUS_TAB[complaint.status] || "#B3A98E";

  return (
    <div
      className="flex items-stretch gap-3 overflow-hidden rounded-sm transition-colors duration-150"
      style={{
        background: "#FBF7EE",
        border: selected ? "1px solid #7A2331" : "1px solid #E3D6B4",
        boxShadow: selected ? "0 0 0 1px rgba(122,35,49,0.15)" : "none",
      }}
    >
      {/* Folder-tab edge, colored by status */}
      <div className="w-1.5 shrink-0" style={{ background: tabColor }} />

      <div className="flex flex-1 items-center gap-3 py-4 pr-4">
        {selectable && (
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggleSelect?.(complaint._id)}
            onClick={(e) => e.stopPropagation()}
            aria-label={`Select complaint ${ticketNumber(complaint._id)}`}
            className="h-4 w-4 shrink-0 cursor-pointer rounded border-[#D9CCAE] focus:ring-[#7A2331]"
            style={{ accentColor: "#7A2331" }}
          />
        )}

        <Link
          to={`/complaints/${complaint._id}`}
          className="flex min-w-0 flex-1 items-center gap-4 hover:opacity-90"
        >
          {/* Department Stamp */}
          <RoutingStamp department={complaint.department} />

          {/* Attachment thumbnail — only when the complaint has an image */}
          {complaint.image && (
            <img
              src={resolveImageUrl(complaint.image)}
              alt=""
              className="h-12 w-12 shrink-0 rounded-sm object-cover"
              style={{ border: "1px solid #E3D6B4" }}
            />
          )}

          {/* Complaint Info */}
          <div className="min-w-0 flex-1">
            {/* Ticket Number & Date */}
            <div className="mb-1.5 flex items-center gap-2 text-xs text-[#9C9182]">
              <span className="font-medium text-[#7A6F5E]">{ticketNumber(complaint._id)}</span>

              <span>·</span>

              <span>{formatDate(complaint.createdAt)}</span>

              {showSubmitter && complaint.submittedBy?.name && (
                <>
                  <span>·</span>
                  <span className="truncate">{complaint.submittedBy.name}</span>
                </>
              )}
            </div>

            {/* Complaint Title */}
            <h3
              className="truncate text-lg font-semibold text-[#2B2420]"
              style={{ fontFamily: "'Fraunces', serif" }}
            >
              {complaint.title}
            </h3>

            {/* Department */}
            <p className="mt-0.5 text-sm text-[#7A6F5E]">{complaint.department}</p>

            {showSimilarFlag && similarCount > 0 && (
              <span
                className="mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
                style={{ background: "#F1E6C8", color: "#8A6A1F" }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                {similarCount} similar report{similarCount === 1 ? "" : "s"}
              </span>
            )}
          </div>

          {/* Status */}
          <StatusBadge status={complaint.status} />
        </Link>
      </div>
    </div>
  );
}