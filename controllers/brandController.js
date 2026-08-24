import Brand from '../models/brandModel.js';

// @desc    Get all brands
// @route   GET /api/brands
// @access  Public
export const getBrands = async (req, res) => {
  try {
    const brands = await Brand.find({});
    res.json(brands);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get a single brand by ID
// @route   GET /api/brands/:id
// @access  Public
export const getBrandById = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (brand) {
      res.json(brand);
    } else {
      res.status(404).json({ message: 'Brand not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new brand
// @route   POST /api/brands
// @access  Private/Admin
export const createBrand = async (req, res) => {
  try {
    const { brandName, brandSku, description, status, category, metaTitle, metaDescription } = req.body;
    
    let brandLogo = '';
    let galleryImages = [];

    if (req.files) {
      if (req.files.brandLogo && req.files.brandLogo.length > 0) {
        brandLogo = `/uploads/${req.files.brandLogo[0].filename}`;
      }
      if (req.files.galleryImages && req.files.galleryImages.length > 0) {
        galleryImages = req.files.galleryImages.map(file => `/uploads/${file.filename}`);
      }
    }

    const brand = new Brand({
      brandName,
      brandSku,
      description,
      status: status || 'Active',
      category,
      brandLogo,
      galleryImages,
      metaTitle,
      metaDescription
    });

    const createdBrand = await brand.save();
    res.status(201).json(createdBrand);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a brand
// @route   PUT /api/brands/:id
// @access  Private/Admin
export const updateBrand = async (req, res) => {
  try {
    const { brandName, brandSku, description, status, category, metaTitle, metaDescription } = req.body;

    const brand = await Brand.findById(req.params.id);

    if (brand) {
      brand.brandName = brandName || brand.brandName;
      brand.brandSku = brandSku || brand.brandSku;
      brand.description = description || brand.description;
      brand.status = status || brand.status;
      brand.category = category || brand.category;
      brand.metaTitle = metaTitle || brand.metaTitle;
      brand.metaDescription = metaDescription || brand.metaDescription;

      if (req.files) {
        if (req.files.brandLogo && req.files.brandLogo.length > 0) {
          brand.brandLogo = `/uploads/${req.files.brandLogo[0].filename}`;
        }
        if (req.files.galleryImages && req.files.galleryImages.length > 0) {
          // You might want to append or replace, replacing for simplicity
          brand.galleryImages = req.files.galleryImages.map(file => `/uploads/${file.filename}`);
        }
      }

      const updatedBrand = await brand.save();
      res.json(updatedBrand);
    } else {
      res.status(404).json({ message: 'Brand not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a brand
// @route   DELETE /api/brands/:id
// @access  Private/Admin
export const deleteBrand = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);

    if (brand) {
      await Brand.deleteOne({ _id: brand._id });
      res.json({ message: 'Brand removed' });
    } else {
      res.status(404).json({ message: 'Brand not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a brand's status
// @route   PATCH /api/brands/:id/status
// @access  Private/Admin
export const updateBrandStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (status !== 'Active' && status !== 'Inactive') {
      return res.status(400).json({ message: 'Status must be Active or Inactive' });
    }

    const brand = await Brand.findById(req.params.id);

    if (brand) {
      brand.status = status;
      const updatedBrand = await brand.save();
      res.json(updatedBrand);
    } else {
      res.status(404).json({ message: 'Brand not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
