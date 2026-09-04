import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { STAFF_ROLES } from "../utils/constants";

function EyeIcon({ open }) {
  return open ? (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

// Underline-style field, styled like a line in a ledger book rather than
// a boxed SaaS input. The blue rule under it expands from the center
// when the field is focused.
function LedgerField({ label, action, children }) {
  return (
    <div className="flex flex-col">
      <div className="mb-1.5 flex items-center justify-between">
        <label className="text-[13px] font-medium tracking-wide text-[#5b5147]">
          {label}
        </label>
        {action}
      </div>
      <div className="ledger-field relative">
        {children}
      </div>
    </div>
  );
}

export default function Login() {
  const { login, user, isStaff } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successRole, setSuccessRole] = useState(null); // set briefly on success, before redirecting

  // If already logged in, route straight to the right dashboard rather
  // than always sending staff accounts to the student view.
  useEffect(() => {
    if (user) {
      navigate(isStaff ? "/staff" : "/dashboard");
    }
  }, [user, isStaff, navigate]);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSubmitting(true);

    try {
      const loggedInUser = await login(form.email.trim(), form.password);

      const goingToStaff = STAFF_ROLES.includes(loggedInUser.role);
      setSuccessRole(goingToStaff ? "staff" : "student");

      navigate(goingToStaff ? "/staff" : "/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid email or password");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{ background: "#EEF0F3", fontFamily: "'Inter', sans-serif" }}
    >
      {/* Fonts + ledger-specific styles. Fraunces carries the identity in
          headings and the seal; Inter stays quiet for body/UI text. */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600&display=swap');

        .ledger-field input {
          width: 100%;
          background: transparent;
          border: none;
          border-bottom: 1.5px solid #E2E5EA;
          padding: 10px 2px 10px 2px;
          color: #23262B;
          outline: none;
          font-size: 15px;
          transition: border-color 180ms ease;
        }
        .ledger-field input::placeholder {
          color: #A8ADB6;
        }
        .ledger-field input:focus {
          border-bottom-color: #0F2C59;
        }
        .ledger-field::after {
          content: "";
          position: absolute;
          left: 50%;
          bottom: -1.5px;
          height: 2px;
          width: 0%;
          background: #0F2C59;
          transition: width 220ms cubic-bezier(0.65, 0, 0.35, 1), left 220ms cubic-bezier(0.65, 0, 0.35, 1);
        }
        .ledger-field:focus-within::after {
          left: 0%;
          width: 100%;
        }
        @keyframes sealIn {
          from { opacity: 0; transform: scale(0.85) rotate(-6deg); }
          to { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        .seal {
          animation: sealIn 420ms cubic-bezier(0.25, 1, 0.5, 1);
        }
      `}</style>

      <div
        className="w-full max-w-md rounded-sm bg-white px-9 py-10"
        style={{
          border: "1px solid #E5E7EB",
          boxShadow: "0 1px 2px rgba(35,38,43,0.04), 0 12px 32px -12px rgba(35,38,43,0.14)",
        }}
      >
        {/* Seal — the one deliberate bold element on the page */}
        <div className="mb-6 flex flex-col items-center">
          <div
            className="seal flex h-16 w-16 items-center justify-center rounded-full bg-white"
            style={{ border: "2px solid #0F2C59" }}
          >
            <span
              className="text-lg font-semibold text-[#0F2C59]"
              style={{ fontFamily: "'Fraunces', serif" }}
            >
              UCMS
            </span>
          </div>
          <div className="mt-1 h-px w-10" style={{ background: "#1E4C8A" }} />
        </div>

        <h1
          className="text-center text-[28px] font-semibold leading-tight text-[#23262B]"
          style={{ fontFamily: "'Fraunces', serif" }}
        >
          Sign in to your account
        </h1>
        <p className="mt-2 text-center text-sm text-[#6B7280]">
          University Complaint Management System
        </p>

        {error && (
          <div
            className="mt-6 rounded-sm px-4 py-3 text-sm"
            style={{ background: "#F3E4DE", border: "1px solid #E0B7A8", color: "#8A3A24" }}
          >
            {error}
          </div>
        )}

        {successRole && (
          <div
            className="mt-6 rounded-sm px-4 py-3 text-sm"
            style={{ background: "#E7EEF6", border: "1px solid #BBD1E8", color: "#0F2C59" }}
          >
            Signed in — redirecting to your {successRole === "staff" ? "staff" : "student"} dashboard...
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-6">
          <LedgerField label="Email">
            <input
              type="email"
              name="email"
              placeholder="you@university.edu"
              value={form.email}
              onChange={handleChange}
              required
            />
          </LedgerField>

          <LedgerField
            label="Password"
            action={
              <Link
                to="/forgot-password"
                className="text-[13px] font-medium text-[#0F2C59] hover:underline"
              >
                Forgot password?
              </Link>
            }
          >
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
              required
              className="!pr-9"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute inset-y-0 right-0 flex items-center px-1 text-[#9CA3AF] hover:text-[#4B5563]"
            >
              <EyeIcon open={showPassword} />
            </button>
          </LedgerField>

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 rounded-sm py-3 text-sm font-semibold text-white transition-colors duration-150"
            style={{ background: submitting ? "#8FA6C4" : "#0F2C59" }}
            onMouseEnter={(e) => {
              if (!submitting) e.currentTarget.style.background = "#0A1E3F";
            }}
            onMouseLeave={(e) => {
              if (!submitting) e.currentTarget.style.background = "#0F2C59";
            }}
          >
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="mt-8 flex items-center gap-3">
          <div className="h-px flex-1" style={{ background: "#E5E7EB" }} />
          <span className="text-[11px] font-medium tracking-wide text-[#9CA3AF]">
            New to the registry
          </span>
          <div className="h-px flex-1" style={{ background: "#E5E7EB" }} />
        </div>

        <div className="mt-5 flex flex-col items-center gap-2 text-sm text-[#4B5563]">
          <p>
            <Link to="/register" className="font-medium text-[#0F2C59] hover:underline">
              Register as a student/faculty member
            </Link>
          </p>
          <p>
            <Link to="/staff-register" className="font-medium text-[#0F2C59] hover:underline">
              Register a staff account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}