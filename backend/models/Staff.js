const mongoose = require("mongoose");

const staffSchema = new mongoose.Schema(
  {
    restaurantId: { 
      type: mongoose.Schema.Types.ObjectId,
       ref: "Restaurant", 
       required: true, index: true },
    staffId: { 
      type: String, required: true, trim: true 
    },
    name: { 
      type: String,
       required: true,
        trim: true,
         maxlength: 120
         },
    position: { 
      type: String, 
      required: true,
       trim: true,
        default: "Other Staff"
       },
    joinDate: {
       type: Date,
        default: Date.now
       },
    monthlySalary: {
       type: Number,
        min: 0, 
        default: 0 },
    contact: {
       type: String,
        trim: true,
         default: "" 
        },
    status: {
       type: String,
        enum: ["Active", "On leave", "Inactive"], default: "Active" },
  },
  { timestamps: true }
);

staffSchema.index({ restaurantId: 1, staffId: 1 }, { unique: true });

module.exports = mongoose.model("Staff", staffSchema);