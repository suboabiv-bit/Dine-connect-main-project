const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: { 
      type: String,
       required: true,
        trim: true,
         maxlength: 120 
        },
    email: { 
      type: String, required: true, trim: true, lowercase: true, unique: true
     },
    username: { 
      type: String, 
      required: true,
       trim: true,
        lowercase: true,
      unique: true 
    },
    passwordHash: {
       type: String, 
       required: true
       },
    phone: {
       type: String,
        trim: true,
         default: ""
       },
    role: {
       type: String,
        enum: ["owner", "customer", "manager", "kitchen", "admin"],
         default: "customer"
         },
    restaurantId: {
       type: mongoose.Schema.Types.ObjectId,
        ref: "Restaurant", 
        default: null
       },
    profilePicture: { 
      type: String,
       default: "" 
      },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);