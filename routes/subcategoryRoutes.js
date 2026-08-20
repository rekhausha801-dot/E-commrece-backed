import express from "express";
import {
  createSubcategory,
  getSubcategories,
  getSubcategoryById,
  getSubcategoriesByCategory,
  updateSubcategory,
  deleteSubcategory,
  updateSubcategoryStatus,
} from "../controllers/subcategoryController.js";

const router = express.Router();

router.post("/", createSubcategory);
router.get("/", getSubcategories);
router.get("/category/:categoryId", getSubcategoriesByCategory);
router.get("/:id", getSubcategoryById);
router.put("/:id", updateSubcategory);
router.delete("/:id", deleteSubcategory);
router.patch("/:id/status", updateSubcategoryStatus);

export default router;
