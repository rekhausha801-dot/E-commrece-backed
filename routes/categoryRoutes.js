import express from 'express';
import {
  getCategories,
  createCategory,
  updateCategory,
  updateCategoryStatus,
  deleteCategory
} from '../controllers/categoryController.js';

const router = express.Router();

router.route('/')
  .get(getCategories)
  .post(createCategory);

router.route('/:id')
  .put(updateCategory)
  .delete(deleteCategory);

router.route('/:id/status')
  .patch(updateCategoryStatus);

export default router;
