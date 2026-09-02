import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      trim: true,
    },
    password: {
      type: String,
      minlength: 6,
    },
    termsAccepted: {
      type: Boolean,
      required: true,
      default: false,
    },
    profileImage: {
      type: String,
      default: "",
    },
    dateOfBirth: {
      type: String, // Stored as YYYY-MM-DD
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
    },
    role: {
      type: String,
      default: "user",
    },
    provider: {
      type: String,
      default: "local",
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
