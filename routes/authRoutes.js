import express from "express";
import { registerUser, loginUser, getUserProfile, updateUserProfile, adminLogin, googleAuth } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/admin/login", adminLogin);
router.post("/google", googleAuth);
router.route("/profile").get(protect, getUserProfile).put(protect, updateUserProfile);

export default router;
