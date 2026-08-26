import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
    rollNumber: "",
    phone: "",
  });

  const [error, setError] = useState("");
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
      await register(form);

      alert("Registration Successful");

      // navigate("/temp");
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Could not create account");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 px-4 py-8">
      <div className="w-full max-w-lg bg-white shadow-lg rounded-xl p-8">

        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
          Create Account
        </h1>

        <p className="text-center text-gray-500 mb-8">
          Student & Faculty Registration
        </p>

        {error && (
          <div className="bg-red-100 border border-red-300 text-red-700 rounded-md p-3 mb-5">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          {/* Role */}

          <div className="flex flex-col gap-2">
            <label className="font-medium text-gray-700">
              I am a
            </label>

            <div className="flex gap-3">

              {["student", "faculty"].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() =>
                    setForm({
                      ...form,
                      role: r,
                    })
                  }
                  className={`flex-1 py-3 rounded-lg border font-medium capitalize transition ${
                    form.role === r
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  {r}
                </button>
              ))}

            </div>
          </div>

          {/* Name */}

          <div className="flex flex-col">
            <label className="mb-2 font-medium text-gray-700">
              Full Name
            </label>

            <input
              type="text"
              name="name"
              placeholder="Enter your full name"
              value={form.name}
              onChange={handleChange}
              required
              className="border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Email */}

          <div className="flex flex-col">
            <label className="mb-2 font-medium text-gray-700">
              Email
            </label>

            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={handleChange}
              required
              className="border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Roll Number */}

          {form.role === "student" && (
            <div className="flex flex-col">
              <label className="mb-2 font-medium text-gray-700">
                Roll Number
              </label>

              <input
                type="text"
                name="rollNumber"
                placeholder="2023-CS-001"
                value={form.rollNumber}
                onChange={handleChange}
                className="border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          )}

          {/* Phone */}

          <div className="flex flex-col">
            <label className="mb-2 font-medium text-gray-700">
              Phone (Optional)
            </label>

            <input
              type="text"
              name="phone"
              placeholder="+92 300 1234567"
              value={form.phone}
              onChange={handleChange}
              className="border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Password */}

          <div className="flex flex-col">
            <label className="mb-2 font-medium text-gray-700">
              Password
            </label>

            <input
              type="password"
              name="password"
              placeholder="Minimum 6 characters"
              value={form.password}
              onChange={handleChange}
              minLength={6}
              required
              className="border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Submit */}

          <button
            type="submit"
            disabled={submitting}
            className="bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition disabled:bg-gray-400"
          >
            {submitting ? "Creating Account..." : "Create Account"}
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