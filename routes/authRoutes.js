import express from "express";
import { registerUser, loginUser, getUserProfile, updateUserProfile, adminLogin, googleAuth, getActiveSessions, revokeAllSessions, revokeSession } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/admin/login", adminLogin);
router.post("/google", googleAuth);
router.route("/profile").get(protect, getUserProfile).put(protect, updateUserProfile);
// router.put("/password", protect, updatePassword);
// router.put("/security", protect, updateSecuritySettings);
router.get("/sessions", protect, getActiveSessions);
router.delete("/sessions/all", protect, revokeAllSessions);
router.delete("/sessions/:sessionId", protect, revokeSession);

export default router;
