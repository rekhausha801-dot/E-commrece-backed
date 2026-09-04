import express from "express";
import multer from 'multer';
import {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  updateCategoryStatus,
} from "../controllers/categoryController.js";

const router = express.Router();

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fieldSize: 10 * 1024 * 1024 }
});

router.post("/", upload.fields([{ name: 'image', maxCount: 1 }, { name: 'icon', maxCount: 1 }]), createCategory);
router.get("/", getCategories);
router.get("/:id", getCategoryById);
router.put("/:id", upload.fields([{ name: 'image', maxCount: 1 }, { name: 'icon', maxCount: 1 }]), updateCategory);
router.delete("/:id", deleteCategory);
router.patch("/:id/status", updateCategoryStatus);

export default router;
