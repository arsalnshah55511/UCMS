import React from "react";
import { STATUS_STYLES } from "../utils/constants";

export default function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.Pending;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ring-1 font-mono text-[11px] uppercase tracking-wide ${style.text} ${style.bg} ${style.ring}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}
