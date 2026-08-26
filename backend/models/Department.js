const mongoose = require("mongoose");
const { DEPARTMENT_LIST } = require("../config/roles");

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      enum: DEPARTMENT_LIST,
      required: true,
      unique: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    head: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Department", departmentSchema);
