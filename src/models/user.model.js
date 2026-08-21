const { Timestamp } = require("mongodb");
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: function () {
      return this.role === "commuter";
    },
    trim: true,
  },
  businessName: {
    type: String,
    required: function () {
      return this.role === "business";
    },
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  category: {
    type: String,
    required: function () {
      return this.role === "business";
    },
  },
  businessAddress: {
  type: String,
  trim: true,
},
  role: {
    type: String,
    enum: ["commuter", "business", "admin"],
    default: "commuter",
  },
  otp: {
    type: String,
  },
  otpExpiry: {
    type: Date,
  },
  resetPasswordOtp: {
    type: String,
  },

  resetPasswordOtpExpiry: {
    type: Date,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  profilePicture: {
  type: String,
  default: null,
},

  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("User", userSchema);
