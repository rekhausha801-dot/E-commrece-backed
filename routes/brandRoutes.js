import express from 'express';
import { 
  getBrands, 
  getBrandById, 
  createBrand, 
  updateBrand, 
  deleteBrand, 
  updateBrandStatus 
} from '../controllers/brandController.js';
import upload from '../middleware/imageuploads.js'; 
import { protect } from '../src/middlewares/banner.middleware.js';

const router = express.Router();

const cpUpload = upload.fields([
  { name: 'brandLogo', maxCount: 1 },
  { name: 'galleryImages', maxCount: 4 }
]);

router.route('/')
  .get(getBrands)
  .post(cpUpload, createBrand);

router.route('/:id')
  .get(getBrandById)
  .put(cpUpload, updateBrand)
  .delete(deleteBrand);

router.route('/:id/status')
  .patch(updateBrandStatus);

export default router;
