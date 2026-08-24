import Product from '../models/Product.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../config/cloudinary.js';

// Helper function to parse FormData JSON strings
const parseFormDataFields = (data) => {
  const fieldsToParse = ['colors', 'sizes', 'tags', 'specs', 'sizeGuide', 'faqs', 'relatedProducts', 'designs', 'images'];
  fieldsToParse.forEach(field => {
    if (typeof data[field] === 'string') {
      try {
        data[field] = JSON.parse(data[field]);
      } catch (err) {
        // Fallback to array if it's just a comma-separated string, though we expect JSON
      }
    }
  });
  return data;
};

// Search Products with filtering, pagination, and sorting
export const searchProducts = async (req, res) => {
  try {
    const { 
      q, 
      category, 
      subCategory, 
      brand, 
      minPrice, 
      maxPrice, 
      rating, 
      size, 
      color, 
      sort, 
      page = 1, 
      limit = 20 
    } = req.query;

    let query = {};

    // 1. Text Search or Keyword matching
    if (q) {
      // Create a regex for partial, case-insensitive match
      const searchRegex = new RegExp(q, 'i');
      query.$or = [
        { name: searchRegex },
        { brand: searchRegex },
        { category: searchRegex },
        { subCategory: searchRegex }
      ];
    }

    // 2. Filters
    if (category) query.category = new RegExp(`^${category}$`, 'i');
    if (subCategory) query.subCategory = new RegExp(`^${subCategory}$`, 'i');
    if (brand) query.brand = new RegExp(`^${brand}$`, 'i');
    
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    
    if (rating) query.rating = { $gte: Number(rating) };
    if (size) query.sizes = { $in: size.split(',') }; // Assuming size could be comma separated
    if (color) query.colors = { $in: color.split(',') };

    // 3. Sorting
    let sortOptions = {};
    switch (sort) {
      case 'price_asc':
        sortOptions = { price: 1 };
        break;
      case 'price_desc':
        sortOptions = { price: -1 };
        break;
      case 'newest':
        sortOptions = { createdAt: -1 };
        break;
      case 'rating':
        sortOptions = { rating: -1 };
        break;
      case 'popularity':
        sortOptions = { numReviews: -1 }; // Assuming numReviews correlates to popularity
        break;
      default:
        // relevance - if q is provided, we can sort by text score, but regex doesn't have score.
        // We will default to newest or score if using text search.
        sortOptions = { createdAt: -1 }; 
        break;
    }

    // 4. Pagination
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;

    // 5. Execute Query
    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNumber);

    res.json({
      success: true,
      keyword: q || '',
      total,
      page: pageNumber,
      limit: limitNumber,
      products
    });

  } catch (error) {
    console.error('Search API Error:', error);
    res.status(500).json({ success: false, message: 'Server error during search' });
  }
};

export const getProducts = async (req, res) => {
  try {
    const products = await Product.find({}).sort({ createdAt: -1 }).populate('category');
    res.json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('category');
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const getProductsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const products = await Product.find({ category: categoryId }).populate('category');
    
    // Filter active category products only if category exists and is active
    const activeProducts = products.filter(p => p.category && p.category.status === 'active');

    res.json({
      success: true,
      count: activeProducts.length,
      data: activeProducts
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const createProduct = async (req, res) => {
  try {
    let productData = { ...req.body };
    productData = parseFormDataFields(productData);
    
    // Auto-generate SKU if not provided
    if (!productData.sku) {
      let prefix = 'PRD'; // Default fallback prefix

      // Try to fetch Category to create a meaningful prefix
      if (productData.category) {

        const Category = (await import('../models/Category.js')).default;
        const categoryDoc = await Category.findById(productData.category);
        
        if (categoryDoc && categoryDoc.name) {
          // Take first 4 characters of category name, uppercase
          const catPrefix = categoryDoc.name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 4).toUpperCase();
          
          if (productData.subCategory) {
            // Take first 2 characters of subcategory, uppercase
            const subCatPrefix = productData.subCategory.replace(/[^a-zA-Z0-9]/g, '').substring(0, 2).toUpperCase();
            prefix = `${catPrefix}-${subCatPrefix}`;
          } else {
            prefix = catPrefix;
          }
        }
      }

      // Find the last created product with this specific prefix to determine the next SKU number
      const lastProduct = await Product.findOne({ sku: new RegExp(`^${prefix}-`) }).sort({ _id: -1 });
      let nextNum = 1;
      
      if (lastProduct && lastProduct.sku) {
        // Extract the number part from the end of the SKU
        const parts = lastProduct.sku.split('-');
        const lastNum = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(lastNum)) {
          nextNum = lastNum + 1;
        } else {
          const count = await Product.countDocuments({ sku: new RegExp(`^${prefix}-`) });
          nextNum = count + 1;
        }
      }

      productData.sku = `${prefix}-${nextNum.toString().padStart(3, '0')}`;
    }

    // Explicitly check for duplicate SKU to provide a better error message
    const existingSku = await Product.findOne({ sku: productData.sku });
    if (existingSku) {
      return res.status(400).json({ 
        success: false, 
        message: `SKU '${productData.sku}' already exists. Please choose a different SKU.` 
      });
    }

    // Handle Image Uploads
    productData.images = productData.images || [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await uploadToCloudinary(file.buffer, 'ecommerce/products');
        productData.images.push({
          url: result.secure_url,
          public_id: result.public_id,
          alt: file.fieldname === 'coverImage' ? 'Main' : 'Gallery'
        });
      }
    }

    const product = await Product.create(productData);
    res.status(201).json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Failed to create product', error: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    let productData = { ...req.body };
    productData = parseFormDataFields(productData);
    
    const existingProduct = await Product.findById(req.params.id);
    if (!existingProduct) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    // Handle Images
    const existingImages = productData.images || []; // the images sent from frontend that should be kept
    const imagesToKeepIds = existingImages.map(img => img.public_id).filter(Boolean);

    // Find images to delete from Cloudinary
    for (const oldImg of existingProduct.images) {
      if (oldImg.public_id && !imagesToKeepIds.includes(oldImg.public_id)) {
        await deleteFromCloudinary(oldImg.public_id);
      }
    }

    // Upload new files
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await uploadToCloudinary(file.buffer, 'ecommerce/products');
        existingImages.push({
          url: result.secure_url,
          public_id: result.public_id,
          alt: file.fieldname === 'coverImage' ? 'Main' : 'Gallery'
        });
      }
    }
    
    productData.images = existingImages;

    const product = await Product.findByIdAndUpdate(req.params.id, productData, {
      new: true,
      runValidators: true
    });
    
    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Failed to update product', error: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    // Delete images from Cloudinary
    if (product.images && product.images.length > 0) {
      for (const img of product.images) {
        if (img.public_id) {
          await deleteFromCloudinary(img.public_id);
        }
      }
    }

    await Product.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Failed to delete product', error: error.message });
  }
};

export const getNextSku = async (req, res) => {
  try {
    const { category, subCategory } = req.query;
    let prefix = 'PRD'; // Default fallback prefix

    // Try to fetch Category to create a meaningful prefix
    if (category) {
      const Category = (await import('../models/Category.js')).default;
      const categoryDoc = await Category.findById(category);
      
      if (categoryDoc && categoryDoc.name) {
        const catPrefix = categoryDoc.name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 4).toUpperCase();
        
        if (subCategory) {
          const subCatPrefix = subCategory.replace(/[^a-zA-Z0-9]/g, '').substring(0, 2).toUpperCase();
          prefix = `${catPrefix}-${subCatPrefix}`;
        } else {
          prefix = catPrefix;
        }
      }
    }

    // Find the last created product with this specific prefix
    const lastProduct = await Product.findOne({ sku: new RegExp(`^${prefix}-`) }).sort({ _id: -1 });
    let nextNum = 1;
    
    if (lastProduct && lastProduct.sku) {
      const parts = lastProduct.sku.split('-');
      const lastNum = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastNum)) {
        nextNum = lastNum + 1;
      } else {
        const count = await Product.countDocuments({ sku: new RegExp(`^${prefix}-`) });
        nextNum = count + 1;
      }
    }

    const nextSku = `${prefix}-${nextNum.toString().padStart(3, '0')}`;
    
    res.json({
      success: true,
      sku: nextSku
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get next SKU', error: error.message });
  }
};
