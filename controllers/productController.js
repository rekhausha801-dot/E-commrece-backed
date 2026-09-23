import Product from '../models/Product.js';
import Category from '../models/Category.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../config/cloudinary.js';

// Helper function to parse FormData JSON strings
const parseFormDataFields = (data) => {
  const fieldsToParse = ['colors', 'sizes', 'tags', 'specs', 'sizeGuide', 'faqs', 'relatedProducts', 'designs', 'images', 'limitedOfferDetails'];
  fieldsToParse.forEach(field => {
    if (typeof data[field] === 'string') {
      try {
        data[field] = JSON.parse(data[field]);
      } catch (err) {
        // Fallback to array if it's just a comma-separated string, though we expect JSON
      }
    }
  });

  if (data.limitedOfferDetails) {
    if (data.limitedOfferDetails.offerPrice === "" || data.limitedOfferDetails.offerPrice === null) delete data.limitedOfferDetails.offerPrice;
    if (data.limitedOfferDetails.startDate === "" || data.limitedOfferDetails.startDate === null) delete data.limitedOfferDetails.startDate;
    if (data.limitedOfferDetails.endDate === "" || data.limitedOfferDetails.endDate === null) delete data.limitedOfferDetails.endDate;
    if (data.limitedOfferDetails.stockLimit === "" || data.limitedOfferDetails.stockLimit === null) delete data.limitedOfferDetails.stockLimit;
  }
  
  if (data.isLimitedOffer === 'true') data.isLimitedOffer = true;
  if (data.isLimitedOffer === 'false') data.isLimitedOffer = false;
  if (data.customizable === 'true') data.customizable = true;
  if (data.customizable === 'false') data.customizable = false;
  if (data.limitedOfferEndDate === "") data.limitedOfferEndDate = null;

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
      
      const matchingCategories = await Category.find({ name: searchRegex }).select('_id');
      const categoryIds = matchingCategories.map(cat => cat._id);

      query.$or = [
        { name: searchRegex },
        { brand: searchRegex },
        { subCategory: searchRegex }
      ];

      if (categoryIds.length > 0) {
        query.$or.push({ category: { $in: categoryIds } });
      }
    }

    // 2. Filters
    if (category) {
      if (category.match(/^[0-9a-fA-F]{24}$/)) {
        query.category = category;
      } else {
        const matchedCategory = await Category.findOne({ name: new RegExp(`^${category}$`, 'i') }).select('_id');
        if (matchedCategory) {
          query.category = matchedCategory._id;
        } else {
          // If category by name not found, ensure query returns nothing
          query.category = '000000000000000000000000';
        }
      }
    }
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
      .select('-designs -seoTitle -seoDesc -seoKeywords -faqs -sizeGuide -shortDesc -specs')
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNumber)
      .populate('category', 'name')
      .lean();

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
    // Pagination support (backward-compatible: default to page=1, limit=50)
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
    const skip = (page - 1) * limit;

    // Lightweight projection: exclude heavy Base64-capable fields from the list endpoint.
    // designs[].modelImage can contain large Base64 strings (4-5MB per product).
    // Product Detail page uses getProductById which returns full data.
    const PRODUCT_LIST_PROJECTION = '-designs -seoTitle -seoDesc -seoKeywords -faqs -sizeGuide -shortDesc -specs';

    const [total, products] = await Promise.all([
      Product.countDocuments({}),
      Product.find({})
        .select(PRODUCT_LIST_PROJECTION)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('category', 'name description status icon')
        .lean()
    ]);

    res.json({
      success: true,
      count: total,          // backward-compatible: total count
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data: products
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const getProductById = async (req, res) => {
  try {
    let product = null;
    if (req.params.id && req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(req.params.id)
        .populate('category', 'name description status icon')
        .lean();
    }
    if (!product) {
      return res.json({ success: false, data: null, error: 'Product not found' });
    }

    // Sanitize designs[].modelImage — strip any remaining Base64 blobs
    // so the detail page doesn't receive multi-MB data for unmigrated products
    if (product.designs && product.designs.length > 0) {
      product.designs = product.designs.map(d => ({
        ...d,
        modelImage: d.modelImage && (d.modelImage.startsWith('http://') || d.modelImage.startsWith('https://'))
          ? d.modelImage
          : null
      }));
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    res.json({ success: false, data: null, error: 'Product not found' });
  }
};

export const getProductsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    let query = {};

    if (!categoryId || categoryId.toLowerCase() === 'all') {
      query = {};
    } else if (categoryId.match(/^[0-9a-fA-F]{24}$/)) {
      query.category = categoryId;
    } else {
      const targetName = categoryId.replace(/-/g, ' ');
      const cleanTarget = categoryId.replace(/[^a-z0-9]/gi, '');

      const catDoc = await Category.findOne({
        $or: [
          { name: new RegExp(`^${targetName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
          { name: new RegExp(cleanTarget, 'i') }
        ]
      });

      if (catDoc) {
        query.category = catDoc._id;
      } else {
        const searchRegex = new RegExp(targetName, 'i');
        query = {
          $or: [
            { subCategory: searchRegex },
            { homeSection: searchRegex },
            { name: searchRegex }
          ]
        };
      }
    }

    const PRODUCT_LIST_PROJECTION = '-designs -seoTitle -seoDesc -seoKeywords -faqs -sizeGuide -shortDesc -specs';

    const products = await Product.find(query)
      .select(PRODUCT_LIST_PROJECTION)
      .populate('category', 'name description status icon')
      .sort({ createdAt: -1 })
      .lean();

    // Filter active category products (support 'Active', 'active', or missing status)
    const activeProducts = products.filter(p => {
      if (!p.category) return true;
      const st = (p.category.status || '').toLowerCase();
      return st === 'active' || st === '';
    });

    res.json({
      success: true,
      count: activeProducts.length,
      data: activeProducts
    });
  } catch (error) {
    console.error("Error in getProductsByCategory:", error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const generateUniqueSku = async (category, subCategory) => {
  let prefix = 'PRD'; // Default fallback prefix

  // Try to fetch Category to create a meaningful prefix
  if (category) {
    try {
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
    } catch (e) {
      console.error('Error finding category for SKU prefix:', e);
    }
  }

  // Find all products matching prefix to find true max number
  const productsWithPrefix = await Product.find({ sku: new RegExp(`^${prefix}-`, 'i') }, { sku: 1 });
  let maxNum = 0;
  for (const p of productsWithPrefix) {
    if (p.sku) {
      const parts = p.sku.split('-');
      const num = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  }

  let nextNum = maxNum + 1;
  let candidateSku = `${prefix}-${nextNum.toString().padStart(3, '0')}`;

  while (await Product.findOne({ sku: candidateSku })) {
    nextNum++;
    candidateSku = `${prefix}-${nextNum.toString().padStart(3, '0')}`;
  }

  return candidateSku;
};

// Helper function to process Base64 images in designs array
const processDesignImages = async (designs, sku) => {
  if (!designs || !Array.isArray(designs)) return designs;
  
  for (let i = 0; i < designs.length; i++) {
    const design = designs[i];
    
    // Process modelImage
    if (design.modelImage && design.modelImage.startsWith('data:image/')) {
      try {
        const base64Data = design.modelImage.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, 'base64');
        const result = await uploadToCloudinary(buffer, 'ecommerce/products/designs');
        design.modelImage = result.secure_url;
      } catch (err) {
        console.error(`Failed to upload modelImage for design ${design.name}`, err);
      }
    }
    
    // Process icon
    if (design.icon && design.icon.startsWith('data:image/')) {
      try {
        const base64Data = design.icon.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, 'base64');
        const result = await uploadToCloudinary(buffer, 'ecommerce/products/designs');
        design.icon = result.secure_url;
      } catch (err) {
        console.error(`Failed to upload icon for design ${design.name}`, err);
      }
    }
  }
  return designs;
};

export const createProduct = async (req, res) => {
  try {
    let productData = { ...req.body };
    productData = parseFormDataFields(productData);

    // Auto-generate or deduplicate SKU if not provided or already exists
    if (!productData.sku || (await Product.findOne({ sku: productData.sku }))) {
      productData.sku = await generateUniqueSku(productData.category, productData.subCategory);
    }

    // Process Base64 images in designs array
    if (productData.designs && productData.designs.length > 0) {
      productData.designs = await processDesignImages(productData.designs, productData.sku);
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
    import('fs').then(fs => fs.appendFileSync('./scratch/error.log', new Date().toISOString() + ': ' + error.stack + '\n'));
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

    // Process Base64 images in designs array
    if (productData.designs && productData.designs.length > 0) {
      productData.designs = await processDesignImages(productData.designs, existingProduct.sku || 'updated');
    }

    // Handle Images
    const existingImages = productData.images || []; // the images sent from frontend that should be kept
    const imagesToKeepIds = existingImages.map(img => img.public_id).filter(Boolean);

    // Find images to delete from Cloudinary but don't delete yet!
    const oldImagesToDelete = [];
    for (const oldImg of existingProduct.images) {
      if (oldImg.public_id && !imagesToKeepIds.includes(oldImg.public_id)) {
        oldImagesToDelete.push(oldImg.public_id);
      }
    }

    // Upload new files
    const newlyUploadedPublicIds = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await uploadToCloudinary(file.buffer, 'ecommerce/products');
        existingImages.push({
          url: result.secure_url,
          public_id: result.public_id,
          alt: file.fieldname === 'coverImage' ? 'Main' : 'Gallery'
        });
        newlyUploadedPublicIds.push(result.public_id);
      }
    }

    productData.images = existingImages;

    const product = await Product.findByIdAndUpdate(req.params.id, productData, {
      new: true,
      runValidators: true
    });

    // Safely delete old images now that the DB has successfully saved
    for (const publicId of oldImagesToDelete) {
      await deleteFromCloudinary(publicId).catch(console.error);
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    // Rollback: if DB save fails, delete newly uploaded images
    if (typeof newlyUploadedPublicIds !== 'undefined' && newlyUploadedPublicIds.length > 0) {
      for (const publicId of newlyUploadedPublicIds) {
        await deleteFromCloudinary(publicId).catch(console.error);
      }
    }
    
    console.error('Error in updateProduct:', error);
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
    const nextSku = await generateUniqueSku(category, subCategory);

    res.json({
      success: true,
      sku: nextSku
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get next SKU', error: error.message });
  }
};
