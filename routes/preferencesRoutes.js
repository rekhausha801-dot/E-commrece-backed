import express from 'express';
import { getPreferences, updatePreferences } from '../controllers/preferencesController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(getPreferences)
  .put(protect, admin, updatePreferences);

export default router;
