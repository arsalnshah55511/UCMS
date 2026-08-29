import React from "react";
import { Link } from "react-router-dom";
import StatusBadge from "./StatusBadge";
import RoutingStamp from "./RoutingStamp";

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

export default function ComplaintCard({
  complaint,
  showSubmitter = false,
  showSimilarFlag = false,
  selectable = false,
  selected = false,
  onToggleSelect,
}) {
  const similarCount = complaint.relatedComplaints?.length || 0;

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border bg-white p-4 shadow-sm transition-all duration-300 ${
        selected ? "border-blue-500 ring-1 ring-blue-200" : "border-gray-300"
      }`}
    >
      {selectable && (
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggleSelect?.(complaint._id)}
          onClick={(e) => e.stopPropagation()}
          aria-label={`Select complaint ${ticketNumber(complaint._id)}`}
          className="h-4 w-4 shrink-0 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      )}

      <Link
        to={`/complaints/${complaint._id}`}
        className="flex flex-1 items-center gap-4 min-w-0 hover:opacity-90"
      >
        {/* Department Stamp */}
        <RoutingStamp department={complaint.department} />

        {/* Complaint Info */}
        <div className="flex-1 min-w-0">

          {/* Ticket Number & Date */}
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
            <span>{ticketNumber(complaint._id)}</span>

            <span>•</span>

            <span>{formatDate(complaint.createdAt)}</span>

            {showSubmitter && complaint.submittedBy?.name && (
              <>
                <span>•</span>
                <span className="truncate">
                  {complaint.submittedBy.name}
                </span>
              </>
            )}
          </div>

          {/* Complaint Title */}
          <h3 className="text-lg font-semibold text-gray-800 truncate">
            {complaint.title}
          </h3>

          {/* Department */}
          <p className="text-sm text-gray-600 mt-1">
            {complaint.department}
          </p>

          {showSimilarFlag && similarCount > 0 && (
            <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
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
  );
}