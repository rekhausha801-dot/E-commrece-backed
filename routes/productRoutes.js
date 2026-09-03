import express from 'express';
import multer from 'multer';
import { getProducts, getProductById, searchProducts, getProductsByCategory, createProduct, updateProduct, deleteProduct, getNextSku } from '../controllers/productController.js';

const router = express.Router();

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fieldSize: 10 * 1024 * 1024 } // 10MB limit for large base64 string fields
});

// Place specific routes before parameterized routes
router.get('/search', searchProducts);
router.get('/next-sku', getNextSku);
router.get('/category/:categoryId', getProductsByCategory);

router.get('/', getProducts);
// Accept multiple files: a main cover image and up to 4 gallery images (though we can just accept any array of files)
router.post('/', upload.any(), createProduct);
router.get('/:id', getProductById);
router.put('/:id', upload.any(), updateProduct);
router.delete('/:id', deleteProduct);

export default router;
