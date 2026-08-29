import React, { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setSubmitting(true);

    try {
      const { data } = await api.post("/api/auth/forgot-password", {
        email: email.trim(),
      });
      setMessage(data.message);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white shadow-lg rounded-xl p-8">

        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
          Forgot Password
        </h1>

        <p className="text-center text-gray-500 mb-8">
          Enter your account email and we'll send you a reset link.
        </p>

        {error && (
          <div className="bg-red-100 text-red-700 border border-red-300 rounded-md p-3 mb-5">
            {error}
          </div>
        )}

        {message ? (
          <div className="bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-md p-4 mb-5">
            {message}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col">
              <label className="mb-2 font-medium text-gray-700">
                Email
              </label>

              <input
                type="email"
                name="email"
                placeholder="Enter your account email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition disabled:bg-gray-400"
            >
              {submitting ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        )}

        <div className="text-center mt-6 text-gray-600">
          <Link to="/login" className="text-blue-600 hover:underline">
            Back to Login
          </Link>
        </div>

      </div>
    </div>
  );
}