import React from "react";

export default function EmptyState({ title, subtitle, action }) {
  return (
    <div className="paper flex flex-col items-center justify-center text-center gap-3 py-16 px-6">
      <div className="w-12 h-12 rounded-full border-2 border-dashed border-ink-200 flex items-center justify-center text-ink-300 font-display text-xl">
        ?
      </div>
      <div>
        <p className="font-display text-lg text-ink-800">{title}</p>
        {subtitle && <p className="text-sm text-slate-ink mt-1 max-w-sm">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
