const express = require("express")
const {getDepartments, updateDepartment } = require("../controllers/departmentController")
const {protect}=require("../middleware/auth")
const {authorize} =require("../middleware/roleCheck")

const router = express.Router();

router.get("/", protect, getDepartments);
router.put("/:name", protect, authorize("vc"), updateDepartment);

module.exports = router;
 
