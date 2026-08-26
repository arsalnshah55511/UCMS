import React from "react";
import { DEPARTMENT_INITIALS } from "../utils/constants";

// The "official routing stamp" — a circular ink-stamp badge showing which
// department a complaint was auto-assigned to. This is the app's signature
// visual motif, echoing a registrar's paper stamp.
export default function RoutingStamp({ department, size = "md" }) {
  const initials = DEPARTMENT_INITIALS[department] || "—";
  const sizes = {
    sm: "w-11 h-11 text-[9px]",
    md: "w-14 h-14 text-[10px]",
    lg: "w-20 h-20 text-xs",
  };

  return (
    <div
      className={`stamp ${sizes[size]} border-brass-dark text-brass-dark bg-parchment-light`}
      title={`Auto-routed to ${department}`}
    >
      <span className="px-1 leading-tight">{initials}</span>
    </div>
  );
}
