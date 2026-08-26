// Mirrors backend/config/roles.js — keep in sync with the API.

export const ROLES = {
  STUDENT: "student",
  FACULTY: "faculty",
  HOD: "hod",
  ADMIN_OFFICE: "admin_office",
  PROVOST: "provost",
  VC: "vc",
};

// Roles that submit complaints (the "student side" of the app).
export const SUBMITTER_ROLES = [ROLES.STUDENT, ROLES.FACULTY];

// Roles that manage / resolve complaints (the "staff side" of the app).
export const STAFF_ROLES = [ROLES.HOD, ROLES.ADMIN_OFFICE, ROLES.PROVOST, ROLES.VC];

// Roles that can actually be created through staff registration.
// Only Head of Department (per-department) and Vice-Chancellor
// (single account, sees everything) can be registered now.
export const REGISTERABLE_STAFF_ROLES = [ROLES.HOD, ROLES.VC];

export const DEPARTMENTS = [
  "Academic",
  "Maintenance & Facilities",
  "Hostel/Provost Office",
  "IT Services",
  "Administrative Offices",
];

export const COMPLAINT_STATUS = {
  PENDING: "Pending",
  IN_PROCESS: "In-Process",
  RESOLVED: "Resolved",
  REJECTED: "Rejected",
};

export const COMPLAINT_STATUS_LIST = Object.values(COMPLAINT_STATUS);

export const ROLE_LABELS = {
  student: "Student",
  faculty: "Faculty",
  hod: "Head of Department",
  admin_office: "Admin Office",
  provost: "Provost",
  vc: "Vice-Chancellor",
};

// Short, readable label for each department — used on the routing stamp.
export const DEPARTMENT_INITIALS = {
  Academic: "ACAD",
  "Maintenance & Facilities": "MAINT",
  "Hostel/Provost Office": "HOST",
  "IT Services": "IT",
  "Administrative Offices": "ADMIN",
};

export const STATUS_STYLES = {
  Pending: { text: "text-amber-flag", bg: "bg-amber-flag-light", ring: "ring-amber-flag/30" },
  "In-Process": { text: "text-ink-600", bg: "bg-ink-50", ring: "ring-ink-300/40" },
  Resolved: { text: "text-sage", bg: "bg-sage-light", ring: "ring-sage/30" },
  Rejected: { text: "text-seal-red", bg: "bg-seal-red/10", ring: "ring-seal-red/30" },
};