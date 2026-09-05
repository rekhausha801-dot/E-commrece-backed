import express from 'express';
import multer from 'multer';
import { protect, admin } from '../middleware/authMiddleware.js';
import { downloadTemplate, previewImport, importProducts } from '../controllers/productImport.controller.js';

const router = express.Router();

// Ensure the directory is created if using diskStorage, but memoryStorage is safer for fast parse
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10 MB limit
});

router.get('/template', protect, admin, downloadTemplate);
router.post('/preview', protect, admin, upload.single('file'), previewImport);
router.post('/', protect, admin, importProducts);

export default router;
