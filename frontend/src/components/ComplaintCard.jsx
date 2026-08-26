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
}) {
  return (
    <Link
      to={`/complaints/${complaint._id}`}
      className="flex items-center gap-4 bg-white border border-gray-300 rounded-xl shadow-sm p-4 hover:shadow-md hover:border-blue-500 transition-all duration-300"
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
      </div>

      {/* Status */}
      <StatusBadge status={complaint.status} />
    </Link>
  );
}