import Subcategory from "../models/Subcategory.js";
import Category from "../models/Category.js";

// @desc    Create new subcategory
// @route   POST /api/subcategories
export const createSubcategory = async (req, res) => {
  try {
    const { name, description, image, category } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Subcategory name is required",
      });
    }

    if (!category) {
      return res.status(400).json({
        success: false,
        message: "Category ID is required",
      });
    }

    // Check if category exists
    const parentCategory = await Category.findById(category);
    if (!parentCategory) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Check category status
    if (parentCategory.status === "inactive") {
      return res.status(400).json({
        success: false,
        message: "Cannot create subcategory under inactive category",
      });
    }

    // Check duplicate subcategory inside the same category
    const existingSubcategory = await Subcategory.findOne({
      name: name.trim(),
      category: category,
    });

    if (existingSubcategory) {
      return res.status(400).json({
        success: false,
        message: "Subcategory already exists in this category",
      });
    }

    const subcategory = new Subcategory({
      name: name.trim(),
      description: description ? description.trim() : "",
      image: image || "",
      category: category,
      status: "active",
    });

    const savedSubcategory = await subcategory.save();

    res.status(201).json({
      success: true,
      message: "Subcategory created successfully",
      data: savedSubcategory,
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

// @desc    Get all subcategories
// @route   GET /api/subcategories
export const getSubcategories = async (req, res) => {
  try {
    const subcategories = await Subcategory.find()
      .populate("category", "name status")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: subcategories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};

// @desc    Get subcategory by ID
// @route   GET /api/subcategories/:id
export const getSubcategoryById = async (req, res) => {
  try {
    const subcategory = await Subcategory.findById(req.params.id).populate(
      "category",
      "name description image status"
    );

    if (!subcategory) {
      return res.status(404).json({
        success: false,
        message: "Subcategory not found",
      });
    }

    res.status(200).json({
      success: true,
      data: subcategory,
    });
  } catch (error) {
    if (error.kind === "ObjectId") {
      return res.status(400).json({
        success: false,
        message: "Invalid Subcategory ID",
      });
    }
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};

// @desc    Get subcategories by category
// @route   GET /api/subcategories/category/:categoryId
export const getSubcategoriesByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const parentCategory = await Category.findById(categoryId);
    if (!parentCategory) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // For customer-side usage, we might want to return only active subcategories, 
    // but the requirement says "For customer-side usage, return only active subcategories"
    // Usually we pass a query param or separate route, but here we can return all or active based on query
    // Let's assume standard behavior returns all, but if ?active=true is passed it filters
    // Or we could just return active for this specific route if that's what's meant.
    // Let's just return all subcategories, but the frontend can filter or we can pass a query.
    // I'll return all, as admin needs to see inactive ones too.
    
    let query = { category: categoryId };
    if (req.query.active === 'true') {
        query.status = 'active';
    }

    const subcategories = await Subcategory.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: subcategories,
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

// @desc    Update subcategory
// @route   PUT /api/subcategories/:id
export const updateSubcategory = async (req, res) => {
  try {
    const { name, description, image, category, status } = req.body;

    let subcategory = await Subcategory.findById(req.params.id);

    if (!subcategory) {
      return res.status(404).json({
        success: false,
        message: "Subcategory not found",
      });
    }

    if (category && category !== subcategory.category.toString()) {
      const newParentCategory = await Category.findById(category);
      if (!newParentCategory) {
        return res.status(404).json({
          success: false,
          message: "New Category not found",
        });
      }
      if (newParentCategory.status === "inactive") {
        return res.status(400).json({
          success: false,
          message: "Cannot move subcategory to an inactive category",
        });
      }
      subcategory.category = category;
    }

    if (name) {
      const catId = category || subcategory.category;
      const existingSubcategory = await Subcategory.findOne({
        name: name.trim(),
        category: catId,
      });

      if (
        existingSubcategory &&
        existingSubcategory._id.toString() !== req.params.id
      ) {
        return res.status(400).json({
          success: false,
          message: "Subcategory with this name already exists in the category",
        });
      }
      subcategory.name = name.trim();
    }

    if (description !== undefined) subcategory.description = description.trim();
    if (image !== undefined) subcategory.image = image;
    if (status !== undefined) {
      if (!["active", "inactive"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status",
        });
      }
      subcategory.status = status;
    }

    const updatedSubcategory = await subcategory.save();

    res.status(200).json({
      success: true,
      message: "Subcategory updated successfully",
      data: updatedSubcategory,
    });
  } catch (error) {
    if (error.kind === "ObjectId") {
      return res.status(400).json({
        success: false,
        message: "Invalid Subcategory or Category ID",
      });
    }
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};

// @desc    Delete subcategory
// @route   DELETE /api/subcategories/:id
export const deleteSubcategory = async (req, res) => {
  try {
    const subcategory = await Subcategory.findById(req.params.id);

    if (!subcategory) {
      return res.status(404).json({
        success: false,
        message: "Subcategory not found",
      });
    }

    // If there were related products, we would check them here.
    // e.g. const products = await Product.find({ subcategory: req.params.id });
    // if (products.length > 0) return error.
    
    await subcategory.deleteOne();

    res.status(200).json({
      success: true,
      message: "Subcategory deleted successfully",
    });
  } catch (error) {
    if (error.kind === "ObjectId") {
      return res.status(400).json({
        success: false,
        message: "Invalid Subcategory ID",
      });
    }
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};

// @desc    Update subcategory status
// @route   PATCH /api/subcategories/:id/status
export const updateSubcategoryStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !["active", "inactive"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Allowed values: active, inactive",
      });
    }

    const subcategory = await Subcategory.findById(req.params.id);

    if (!subcategory) {
      return res.status(404).json({
        success: false,
        message: "Subcategory not found",
      });
    }

    subcategory.status = status;
    const updatedSubcategory = await subcategory.save();

    res.status(200).json({
      success: true,
      message: "Subcategory status updated successfully",
      data: updatedSubcategory,
    });
  } catch (error) {
    if (error.kind === "ObjectId") {
      return res.status(400).json({
        success: false,
        message: "Invalid Subcategory ID",
      });
    }
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};
