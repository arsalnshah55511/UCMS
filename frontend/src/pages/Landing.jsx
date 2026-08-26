import React from "react";
import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div className="relative flex min-h-[85vh] items-center justify-center overflow-hidden bg-slate-900 px-4 py-16">
      {/* ambient backdrop */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-24 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)",
            backgroundSize: "42px 42px",
          }}
        />
      </div>

      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-white p-8 shadow-2xl">
        {/* University Logo */}
        <div className="mb-6 flex justify-center">
          <div className="rounded-full border-2 border-amber-500/40 p-2">
            <img
              src="/uop.jpg"
              alt="University of Peshawar Logo"
              className="h-20 w-20 rounded-full object-contain"
            />
          </div>
        </div>

        {/* Heading & Subtitle */}
        <p className="text-center font-mono text-[11px] uppercase tracking-[0.25em] text-amber-600">
          University Complaint Management System
        </p>
        <h1 className="mt-3 text-center font-serif text-3xl font-bold text-slate-900">
          Welcome to UCMS
        </h1>
        <p className="mx-auto mt-3 max-w-xs text-center text-sm leading-relaxed text-slate-500">
          Submit your concerns directly to the right department — quickly, transparently, and
          seamlessly.
        </p>

        {/* Auth Buttons */}
        <div className="mt-8 flex flex-col gap-3">
          <Link
            to="/register"
            className="w-full rounded-xl bg-slate-900 py-3 text-center font-medium text-white transition hover:bg-amber-600"
          >
            Register
          </Link>

          <Link
            to="/login"
            className="w-full rounded-xl border border-slate-200 py-3 text-center font-medium text-slate-700 transition hover:border-slate-900 hover:bg-slate-50"
          >
            Login
          </Link>
        </div>

        {/* Staff Link */}
        <p className="mt-6 text-center text-sm text-slate-500">
          Staff member?{" "}
          <Link to="/staff-register" className="font-medium text-amber-700 hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}