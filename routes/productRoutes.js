import express from 'express';
import { getProducts, getProductById, searchProducts } from '../controllers/productController.js';

const router = express.Router();

// Place specific routes before parameterized routes
router.get('/search', searchProducts);

router.get('/', getProducts);
router.get('/:id', getProductById);

export default router;
