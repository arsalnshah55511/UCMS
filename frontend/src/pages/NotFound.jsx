import React from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="max-w-md mx-auto px-6 py-24 text-center">
      <div className="stamp w-16 h-16 mx-auto mb-5 border-seal-red text-seal-red">
        <span className="text-sm">404</span>
      </div>
      <h1 className="font-display text-2xl text-ink-800 mb-2">Page not found</h1>
      <p className="text-slate-ink text-sm mb-6">
        This page isn't on file. Let's get you back on track.
      </p>
      <Link to="/" className="btn-primary">
        Return home
      </Link>
    </div>
  );
}
