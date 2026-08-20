import Product from '../models/Product.js';

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
    const products = await Product.find({});
    res.json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
