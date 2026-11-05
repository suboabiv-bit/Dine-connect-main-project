const mongoose = require("mongoose");

const restaurantSchema = new mongoose.Schema(
  {
    name: { 
      type: String,
      required: true,
      trim: true,
      maxlength: 120
     },
    slug: { 
      type: String,
      required: true,
      unique: true, 
      lowercase: true,
      trim: true
     },
    ownerId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User",
      required: true,
      index: true 
    },
    contactEmail: { 
      type: String,
      trim: true,
      lowercase: true,
      default: ""
         },
    contactNumber: {
      type: String,
      trim: true, 
      default: ""
       },
    address: { 
     type: String,
     trim: true,
     default: ""
     },
    currency: { 
    type: String,
    default: "LKR"
       },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Restaurant", restaurantSchema);