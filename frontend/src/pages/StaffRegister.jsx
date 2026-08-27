import React, { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { DEPARTMENTS, ROLE_LABELS, REGISTERABLE_STAFF_ROLES } from "../utils/constants";

export default function StaffRegister() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "hod",
    department: DEPARTMENTS[0],
    phone: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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
      await api.post("/api/auth/staff", form);

      setSuccess(true);
    } catch (err) {
      setError(
        err.response?.data?.message || "Could not create staff account"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100 px-4">
        <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-md text-center">

          <div className="w-16 h-16 rounded-full bg-green-100 border-2 border-green-600 flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl text-green-600">✓</span>
          </div>

          <h1 className="text-3xl font-bold text-gray-800 mb-3">
            Account Created
          </h1>

          <p className="text-gray-600 mb-6">
            Your staff account has been created successfully.
          </p>

          <Link
            to="/login"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg inline-block transition"
          >
            Go to Login
          </Link>

        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 py-8 px-4">

      <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-lg">

        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
          Staff Registration
        </h1>

        <p className="text-center text-gray-500 mb-8">
          Create a staff account
        </p>

        {error && (
          <div className="bg-red-100 border border-red-300 text-red-700 rounded-md p-3 mb-5">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          {/* Role */}

          <div className="flex flex-col">
            <label className="font-medium text-gray-700 mb-2">
              Staff Role
            </label>

            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {REGISTERABLE_STAFF_ROLES.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role]}
                </option>
              ))}
            </select>
          </div>

          {/* Name */}

          <div className="flex flex-col">
            <label className="font-medium text-gray-700 mb-2">
              Full Name
            </label>

            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="Dr. Amina Yusuf"
              className="border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Email */}

          <div className="flex flex-col">
            <label className="font-medium text-gray-700 mb-2">
              Email
            </label>

            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              placeholder="you@university.edu"
              className="border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Department */}

          {form.role !== "vc" && (
            <div className="flex flex-col">
              <label className="font-medium text-gray-700 mb-2">
                Department
              </label>

              <select
                name="department"
                value={form.department}
                onChange={handleChange}
                className="border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Phone */}

          <div className="flex flex-col">
            <label className="font-medium text-gray-700 mb-2">
              Phone (Optional)
            </label>

            <input
              type="text"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="+92 300 1234567"
              className="border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Password */}

          <div className="flex flex-col">
            <label className="font-medium text-gray-700 mb-2">
              Password
            </label>

            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              minLength={6}
              placeholder="Minimum 6 characters"
              className="border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Button */}

          <button
            type="submit"
            disabled={submitting}
            className="bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition disabled:bg-gray-400"
          >
            {submitting ? "Creating Account..." : "Create Staff Account"}
          </button>

        </form>

        <div className="text-center mt-6 text-gray-600">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-blue-600 hover:underline font-medium"
          >
            Login
          </Link>
        </div>

      </div>

    </div>
  );
}