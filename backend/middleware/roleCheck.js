/**
 * Usage: authorize("hod", "admin_office") - allows only listed roles.
 * Must run after `protect` so req.user is populated.
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401);
      return next(new Error("Not authorized - no user on request"));
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403);
      return next(
        new Error(`Role '${req.user.role}' is not permitted to perform this action`)
      );
    }

    next();
  };
};

module.exports = { authorize };
