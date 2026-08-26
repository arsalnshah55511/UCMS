import React, { useEffect, useState } from "react"; // ✅ CHANGED: Added useEffect
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// ❌ REMOVE THIS COMMENT IF YOU ARE NOT USING STAFF YET
// import { STAFF_ROLES } from "../utils/constants";

export default function Login() {
  // ✅ CHANGED: Added user
  const { login, user } = useAuth();

  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ✅ CHANGED: If user is already logged in,
  // automatically go to dashboard.
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

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
      // ✅ Login
      await login(form.email, form.password);

      console.log("Login Successful");

      alert("Login Successful");

      // ✅ CHANGED:
      // Since you have NOT built the staff dashboard yet,
      // always go to the student dashboard.
      navigate("/dashboard");

      /*
      ===========================
      LATER, when staff dashboard
      is completed, replace the
      above line with:

      const loggedInUser = await login(form.email, form.password);

      navigate(
        STAFF_ROLES.includes(loggedInUser.role)
          ? "/staff"
          : "/dashboard"
      );

      and uncomment:

      import { STAFF_ROLES } from "../utils/constants";
      ===========================
      */

    } catch (err) {
      setError(err.response?.data?.message || "Invalid email or password");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white shadow-lg rounded-xl p-8">

        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
          Welcome Back
        </h1>

        <p className="text-center text-gray-500 mb-8">
          Sign in to your UCMS account
        </p>

        {error && (
          <div className="bg-red-100 text-red-700 border border-red-300 rounded-md p-3 mb-5">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

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
              className="border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-col">
            <label className="mb-2 font-medium text-gray-700">
              Password
            </label>

            <input
              type="password"
              name="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
              required
              className="border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition disabled:bg-gray-400"
          >
            {submitting ? "Signing In..." : "Login"}
          </button>

        </form>

        <div className="text-center mt-6 text-gray-600">
          <p>
            New here?{" "}
            <Link
              to="/register"
              className="text-blue-600 hover:underline"
            >
              Register
            </Link>
          </p>

          <p className="mt-2">
            Staff account?{" "}
            <Link
              to="/staff-register"
              className="text-blue-600 hover:underline"
            >
              Register Here
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}