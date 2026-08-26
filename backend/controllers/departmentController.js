const asyncHandler = require("express-async-handler")
const Department = require("../models/Department")
const {DEPARTMENT_LIST,DEPARTMENT_HANDLER_ROLE}=require("../config/roles")


/**
 * @desc    List departments (static list + any stored metadata like head)
 * @route   GET /api/departments
 * @access  Private
 */

const getDepartments = asyncHandler(async (req,res)=>{
    const stored = await Department.find().populate("head","name email role")
    const storedByName = Object.fromEntries(stored.map((d)=>[d.name,d])) // fromEntries convert the array into object 

    // Always return all 5 departments, even if not yet seeded in the DB
  const departments = DEPARTMENT_LIST.map((name) => ({
    name,
    handlerRole: DEPARTMENT_HANDLER_ROLE[name],
    description: storedByName[name]?.description || "",
    head: storedByName[name]?.head || null,
  }));

  res.json({ success: true, departments });
})

/**
 * @desc    Update department description / head
 * @route   PUT /api/departments/:name
 * @access  Private (vc only)
 */

const updateDepartment = asyncHandler(async (req, res) => {
  const { name } = req.params;
  const { description, head } = req.body;

  if (!DEPARTMENT_LIST.includes(name)) {
    res.status(400);
    throw new Error("Invalid department name");
  }

  const department = await Department.findOneAndUpdate(
    { name },
    { $set: { description, head } }, // $set updates specific fields.
    { new: true, upsert: true }
  );

  res.json({ success: true, department });
});

module.exports = { getDepartments, updateDepartment };
