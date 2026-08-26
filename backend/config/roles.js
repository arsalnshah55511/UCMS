const ROLES = {
  STUDENT: "student",
  FACULTY: "faculty",
  HOD: "hod",
  ADMIN_OFFICE: "admin_office",
  PROVOST: "provost",
  VC: "vc",
};

const ROLE_LIST = Object.values(ROLES)

// Roles that are allowed to submit complaints
const SUBMITTER_ROLES = [ROLES.STUDENT, ROLES.FACULTY];

// Roles that manage/resolve complaints for a department
const STAFF_ROLES = [ROLES.HOD, ROLES.ADMIN_OFFICE, ROLES.PROVOST, ROLES.VC];


// Only Head of Department (per-department) and Vice-Chancellor

const REGISTERABLE_STAFF_ROLES = [ROLES.HOD, ROLES.VC];


const DEPARTMENTS = {
  ACADEMIC: "Academic",
  MAINTENANCE: "Maintenance & Facilities",
  HOSTEL: "Hostel/Provost Office",
  IT: "IT Services",
  ADMINISTRATIVE: "Administrative Offices",
};

const DEPARTMENT_LIST = Object.values(DEPARTMENTS);

// Which role is responsible for handling complaints of each department.
// The VC role can see/escalate everything regardless of this map.
const DEPARTMENT_HANDLER_ROLE = {
  [DEPARTMENTS.ACADEMIC]: ROLES.HOD,
  [DEPARTMENTS.MAINTENANCE]: ROLES.ADMIN_OFFICE,
  [DEPARTMENTS.HOSTEL]: ROLES.PROVOST,
  [DEPARTMENTS.IT]: ROLES.ADMIN_OFFICE,
  [DEPARTMENTS.ADMINISTRATIVE]: ROLES.ADMIN_OFFICE,
};


const COMPLAINT_STATUS = {
  PENDING: "Pending",
  IN_PROCESS: "In-Process",
  RESOLVED: "Resolved",
  REJECTED: "Rejected",
};

const COMPLAINT_STATUS_LIST = Object.values(COMPLAINT_STATUS);

module.exports = {
  ROLES,
  ROLE_LIST,
  SUBMITTER_ROLES,
  STAFF_ROLES,
  REGISTERABLE_STAFF_ROLES,
  DEPARTMENTS,
  DEPARTMENT_LIST,
  DEPARTMENT_HANDLER_ROLE,
  COMPLAINT_STATUS,
  COMPLAINT_STATUS_LIST,
};