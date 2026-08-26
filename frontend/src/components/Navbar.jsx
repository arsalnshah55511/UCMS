import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ROLE_LABELS } from "../utils/constants";
import NotificationBell from "./NotificationBell";

export default function Navbar() {
  const { user, logout, isStaff } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link
          to={user ? (isStaff ? "/staff" : "/dashboard") : "/"}
          className="flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-full border-2 border-blue-600 flex items-center justify-center text-blue-600 font-bold">
            UC
          </div>

          <span className="text-2xl font-bold text-gray-800">
            UCMS
          </span>
        </Link>

        {/* User Logged In */}
        {user ? (
          <div className="flex items-center gap-5">

            <NotificationBell />

            <div className="hidden sm:flex flex-col items-end">
              <p className="text-gray-800 font-semibold">
                {user.name}
              </p>

              <p className="text-sm text-gray-500">
                {ROLE_LABELS[user.role]}
                {user.department && ` • ${user.department}`}
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg transition"
            >
              Logout
            </button>

          </div>
        ) : (

          /* User Not Logged In */

          <div className="flex gap-3">

            <Link
              to="/login"
              className="border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white px-5 py-2 rounded-lg transition"
            >
              Login
            </Link>

            <Link
              to="/register"
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg transition"
            >
              Register
            </Link>

          </div>
        )}

      </div>
    </header>
  );
}