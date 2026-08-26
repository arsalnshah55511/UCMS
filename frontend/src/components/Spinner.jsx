import React from "react";

export default function Spinner({ label = "Loading" }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-slate-ink font-mono text-xs uppercase tracking-widest">
      <span className="w-3 h-3 border-2 border-ink-200 border-t-brass rounded-full animate-spin" />
      {label}
    </div>
  );
}
