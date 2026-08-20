import express from 'express';
import { getProfile, updateProfile, uploadProfileImage } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.route('/profile')
  .get(protect, getProfile)
  .put(protect, updateProfile);

router.post('/profile-image', protect, upload.single('profileImage'), uploadProfileImage);

export default router;
