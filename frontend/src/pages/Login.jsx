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

// Original UCMS seal: a shield (represents protection/oversight of
// complaints) with a checkmark inside, wrapped in a laurel wreath —
// built entirely in SVG so no external logo image is required.
function UcmsSeal({ size = 128 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="60" r="58" fill="#FFFFFF" stroke="#0F2C59" strokeWidth="2" />
      <path d="M22 44c10 6 22 3 30-8 8 11 20 14 30 8" fill="none" stroke="#2E7D46" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M22 76c10 6 22 3 30-8 8 11 20 14 30 8" fill="none" stroke="#2E7D46" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M60 30l16 6v16c0 12-7 21-16 24-9-3-16-12-16-24V36l16-6z" fill="#0F2C59" />
      <path d="M52 60l6 6 12-13" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Login() {
  const { login, user, isStaff } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: localStorage.getItem("ucms_remembered_email") || "",
    password: "",
  });

  const [rememberMe, setRememberMe] = useState(
    Boolean(localStorage.getItem("ucms_remembered_email"))
  );
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

      if (rememberMe) {
        localStorage.setItem("ucms_remembered_email", form.email.trim());
      } else {
        localStorage.removeItem("ucms_remembered_email");
      }

      const goingToStaff = STAFF_ROLES.includes(loggedInUser.role);
      navigate(goingToStaff ? "/staff" : "/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid email or password");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="flex min-h-screen w-full items-center justify-center p-4 sm:p-8"
      style={{ background: "#EEF0F3", fontFamily: "'Inter', sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Inter:wght@400;500;600&display=swap');

        .field-box {
          width: 100%;
          border: 1px solid #D6DAE1;
          border-radius: 8px;
          padding: 12px 14px;
          font-size: 15px;
          color: #23262B;
          outline: none;
          transition: border-color 150ms ease, box-shadow 150ms ease;
        }
        .field-box::placeholder { color: #A8ADB6; }
        .field-box:focus {
          border-color: #0F2C59;
          box-shadow: 0 0 0 3px rgba(15,44,89,0.12);
        }
      `}</style>

      {/* Boxed card holding both panels */}
      <div
        className="flex w-full max-w-4xl overflow-hidden rounded-2xl bg-white"
        style={{
          border: "1px solid #E5E7EB",
          boxShadow: "0 1px 2px rgba(35,38,43,0.04), 0 20px 48px -16px rgba(35,38,43,0.22)",
        }}
      >
        {/* Left panel — brand */}
        <div
          className="relative hidden w-[42%] flex-col items-center justify-between px-10 py-10 text-white md:flex"
          style={{ background: "#0F2C59" }}
        >
          <p className="self-start text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
            University Complaint Management System
          </p>

          <div className="flex flex-col items-center text-center">
            <UcmsSeal size={120} />

            <h1
              className="mt-5 text-3xl font-bold tracking-wide"
              style={{ fontFamily: "'Fraunces', serif" }}
            >
              UCMS
            </h1>

            <p className="mt-3 max-w-[220px] text-sm leading-relaxed text-white/80">
              University Complaint Management System
            </p>
            <p className="text-sm text-white/80">Peshawar, Pakistan</p>
          </div>

          <p className="text-xs text-white/60">
            Designed and maintained by the Arsalan & Osama team. All rights reserved.
          </p>
        </div>

        {/* Right panel — form */}
        <div className="flex w-full flex-1 items-center justify-center bg-white px-6 py-10 sm:px-12">
          <div className="w-full max-w-sm">
            <h1
              className="text-[28px] font-semibold text-[#0F2C59]"
              style={{ fontFamily: "'Fraunces', serif" }}
            >
              Welcome back
            </h1>
            <p className="mt-2 text-sm text-[#6B7280]">
              Please enter your credentials to access the portal.
            </p>

            {error && (
              <div
                className="mt-6 rounded-lg px-4 py-3 text-sm"
                style={{ background: "#F3E4DE", border: "1px solid #E0B7A8", color: "#8A3A24" }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#4B5563]">
                  Email address
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="you@university.edu"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="field-box"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#4B5563]">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    className="field-box !pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-[#9CA3AF] hover:text-[#4B5563]"
                  >
                    <EyeIcon open={showPassword} />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-[#4B5563]">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-[#D6DAE1] accent-[#0F2C59]"
                  />
                  Remember me
                </label>

                <Link to="/forgot-password" className="font-medium text-[#0F2C59] hover:underline">
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="mt-1 flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold text-white transition-colors duration-150"
                style={{ background: submitting ? "#8FA6C4" : "#0F2C59" }}
                onMouseEnter={(e) => {
                  if (!submitting) e.currentTarget.style.background = "#0A1E3F";
                }}
                onMouseLeave={(e) => {
                  if (!submitting) e.currentTarget.style.background = "#0F2C59";
                }}
              >
                {submitting ? "Signing in..." : "Sign in"}
                {!submitting && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                )}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-[#4B5563]">
              New here?{" "}
              <Link to="/register" className="font-medium text-[#0F2C59] hover:underline">
                Create an account
              </Link>
            </p>
            <p className="mt-2 text-center text-sm text-[#4B5563]">
              Staff member?{" "}
              <Link to="/staff-register" className="font-medium text-[#0F2C59] hover:underline">
                Register here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}