import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";

function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    let cancelled = false;

    const loadNotifications = () => {
      api
        .get("/api/notifications")
        .then(({ data }) => {
          if (!cancelled) setNotifications(data.notifications);
        })
        .catch(() => {
          if (!cancelled) setNotifications([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    };

    loadNotifications();

    // Poll every 60 seconds so new notifications show up without a page reload.
    // (Bumped from 30s to ease pressure on the rate limiter / free-tier backend.)
    const interval = setInterval(loadNotifications, 60000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      try {
        await api.put(`/api/notifications/${notification._id}/read`);
        setNotifications((prev) =>
          prev.map((n) =>
            n._id === notification._id ? { ...n, isRead: true } : n
          )
        );
      } catch {
        // silently ignore — not critical if this fails
      }
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="relative rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
        aria-label="Notifications"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="font-semibold text-slate-900">Notifications</p>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading && (
              <p className="px-4 py-6 text-center text-sm text-slate-400">Loading...</p>
            )}

            {!loading && notifications.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-slate-400">
                No notifications yet.
              </p>
            )}

            {!loading &&
              notifications.map((n) => (
                <Link
                  key={n._id}
                  to={n.complaint ? `/complaints/${n.complaint}` : "#"}
                  onClick={() => handleNotificationClick(n)}
                  className={`block border-b border-slate-50 px-4 py-3 text-sm transition hover:bg-slate-50 ${
                    n.isRead ? "text-slate-500" : "bg-amber-50/50 font-medium text-slate-900"
                  }`}
                >
                  <p>{n.message}</p>
                  <p className="mt-1 text-xs text-slate-400">{timeAgo(n.createdAt)}</p>
                </Link>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}