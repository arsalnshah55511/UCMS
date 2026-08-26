const asyncHandler = require("express-async-handler")
const User = require("../models/User")

/**
 * @desc    List all users, optionally filtered by role/department
 * @route   GET /api/users?role=&department=
 * @access  Private (vc only)
 */

const getUser = asyncHandler(async (req,res)=>{
    const {role,department} = req.query
    const filter = {}
    if(role) filter.role = role
    if(department)filter.department= department

    const users = await User.find(filter).sort({createdAt:-1})
    res.json({success:true,users})
})

/**
 * @desc    Activate/deactivate a user account
 * @route   PUT /api/users/:id/status
 * @access  Private (vc only)
 */
const setUserActiveStatus = asyncHandler(async (req, res) => {
  const { isActive } = req.body;

  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  user.isActive = Boolean(isActive);
  await user.save();

  res.json({ success: true, user });
});

module.exports = { getUsers, setUserActiveStatus };

