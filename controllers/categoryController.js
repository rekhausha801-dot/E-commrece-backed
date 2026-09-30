import { createCustomerNotification } from './customerNotification.controller.js';
import Category from "../models/Category.js";
import Subcategory from "../models/Subcategory.js";
import { uploadToCloudinary, deleteFromCloudinary } from '../config/cloudinary.js';


export const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    const existingCategory = await Category.findOne({ name: name.trim() });
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: "Category already exists",
      });
    }

    let imageUrl = req.body.image || "";
    let imagePublicId = "";
    let iconUrl = req.body.icon || "";
    let iconPublicId = "";

    if (req.files) {
      if (req.files.image && req.files.image[0]) {
        const result = await uploadToCloudinary(req.files.image[0].buffer, 'ecommerce/categories');
        imageUrl = result.secure_url;
        imagePublicId = result.public_id;
      }
      if (req.files.icon && req.files.icon[0]) {
        const result = await uploadToCloudinary(req.files.icon[0].buffer, 'ecommerce/categories/icons');
        iconUrl = result.secure_url;
        iconPublicId = result.public_id;
      }
    }

    const category = new Category({
      name: name.trim(),
      description: description ? description.trim() : "",
      image: imageUrl,
      image_public_id: imagePublicId,
      icon: iconUrl,
      icon_public_id: iconPublicId,
      status: "active",
    });

    const savedCategory = await category.save();

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      category: savedCategory,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};

export const getCategories = async (req, res) => {
  try {
    const categories = await Category.aggregate([
      { $sort: { createdAt: -1 } },
      {
        $project: {
          name: 1,
          description: 1,
          icon: 1,
          status: 1,
          createdAt: 1,
          updatedAt: 1,
          image: {
            $cond: {
              if: { $regexMatch: { input: { $ifNull: ['$image', ''] }, regex: '^https?://' } },
              then: '$image',
              else: null
            }
          }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};


export const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    if (error.kind === "ObjectId") {
      return res.status(400).json({
        success: false,
        message: "Invalid Category ID",
      });
    }
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};


export const updateCategory = async (req, res) => {
  let uploadedImagePublicId = null;
  let uploadedIconPublicId = null;
  try {
    const { name, description, status } = req.body;

    let category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    if (name) {
      const existingCategory = await Category.findOne({ name: name.trim() });
      if (existingCategory && existingCategory._id.toString() !== req.params.id) {
        return res.status(400).json({
          success: false,
          message: "Category with this name already exists",
        });
      }
      category.name = name.trim();
    }

    if (description !== undefined) category.description = description.trim();
    if (status !== undefined) {
      if (!["active", "inactive"].includes(status)) {
        return res.status(400).json({ success: false, message: "Invalid status" });
      }
      category.status = status;
    }

    const oldImagePublicId = category.image_public_id;
    const oldIconPublicId = category.icon_public_id;

    if (req.files) {
      if (req.files.image && req.files.image[0]) {
        const result = await uploadToCloudinary(req.files.image[0].buffer, 'ecommerce/categories');
        category.image = result.secure_url;
        category.image_public_id = result.public_id;
        uploadedImagePublicId = result.public_id;
      }
      if (req.files.icon && req.files.icon[0]) {
        const result = await uploadToCloudinary(req.files.icon[0].buffer, 'ecommerce/categories/icons');
        category.icon = result.secure_url;
        category.icon_public_id = result.public_id;
        uploadedIconPublicId = result.public_id;
      }
    } 
    
    if (req.body.image !== undefined && (!req.files || !req.files.image)) category.image = req.body.image;
    if (req.body.icon !== undefined && (!req.files || !req.files.icon)) category.icon = req.body.icon;

    const updatedCategory = await category.save();

    
    if (uploadedImagePublicId && oldImagePublicId) {
       await deleteFromCloudinary(oldImagePublicId).catch(console.error);
    }
    if (uploadedIconPublicId && oldIconPublicId) {
       await deleteFromCloudinary(oldIconPublicId).catch(console.error);
    }

    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: updatedCategory,
    });
  } catch (error) {
    
    if (uploadedImagePublicId) await deleteFromCloudinary(uploadedImagePublicId).catch(console.error);
    if (uploadedIconPublicId) await deleteFromCloudinary(uploadedIconPublicId).catch(console.error);

    if (error.kind === "ObjectId") {
      return res.status(400).json({
        success: false,
        message: "Invalid Category ID",
      });
    }
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    const subcategories = await Subcategory.find({ category: req.params.id });
    if (subcategories.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete category because subcategories are associated with it",
      });
    }

    if (category.image_public_id) {
      await deleteFromCloudinary(category.image_public_id).catch(console.error);
    }
    if (category.icon_public_id) {
      await deleteFromCloudinary(category.icon_public_id).catch(console.error);
    }

    await category.deleteOne();

    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    if (error.kind === "ObjectId") {
      return res.status(400).json({
        success: false,
        message: "Invalid Category ID",
      });
    }
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};

export const updateCategoryStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !["active", "inactive"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Allowed values: active, inactive",
      });
    }

    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    category.status = status;
    const updatedCategory = await category.save();

    res.status(200).json({
      success: true,
      message: "Category status updated successfully",
      data: updatedCategory,
    });
  } catch (error) {
    if (error.kind === "ObjectId") {
      return res.status(400).json({
        success: false,
        message: "Invalid Category ID",
      });
    }
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};
