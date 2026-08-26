const mongoose = require("mongoose")
const { ROLE_LIST, DEPARTMENT_LIST } = require("../config/roles");
const bcrypt = require("bcryptjs")
// const { default: mongoose } = require("mongoose")

const userSchema= new mongoose.Schema({
    name:{
        type:String,
        required:[true,"name is required"],
        trim:true,
        maxLength:100
    },
    email:{
        type:String,
        required:[true,"Email is required"],
        unique:true,
        trim:true,
        lowercase: true,
         match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"]

    },
    password:{
        type:String,
        required:[true,"password is required"],
        minLength:6,
        select:false // donot fetch the user password when fetch from the database 
    },
    role:{
        type:String,
        required:true,
        enum:ROLE_LIST,
        default:"student"
    },
    department:{
        type:String,
        enum: [...DEPARTMENT_LIST, null],
        default:null
    },
     rollNumber: {
      type: String,
      trim: true,
      default: null, // students only
    },
    phone: {
      type: String,
      trim: true,
      default: null,
    },
     isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true 
})

// Hash password before saving, only if it was modified
userSchema.pre("save", async function () {
  // If password wasn't modified, do nothing
  if (!this.isModified("password")) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Instance method to compare plaintext password with the stored hash
userSchema.methods.matchPassword = async function matchPassword(enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// Never leak password/version key when converting to JSON
userSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("User", userSchema);