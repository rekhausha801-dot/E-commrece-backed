import xlsx from 'xlsx';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Brand from '../models/brandModel.js';

export const downloadTemplate = async (req, res) => {
  try {
    const workbook = xlsx.utils.book_new();
    const headers = [['Product Name', 'SKU', 'Category', 'Brand', 'Price', 'Discount (%)', 'Stock', 'Status']];
    const worksheet = xlsx.utils.aoa_to_sheet(headers);
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Template');

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename="product_import_template.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    console.error('Error generating template:', error);
    res.status(500).json({ success: false, message: 'Failed to generate template' });
  }
};

export const previewImport = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawData = xlsx.utils.sheet_to_json(worksheet);

    if (!rawData || rawData.length === 0) {
      return res.status(400).json({ success: false, message: 'File is empty' });
    }

    // Expected headers
    const expectedHeaders = ['Product Name', 'SKU', 'Category', 'Brand', 'Price', 'Discount (%)', 'Stock', 'Status'];
    const uploadedHeaders = Object.keys(rawData[0] || {});
    
    // Allow if it has at least Name, SKU, Price, Stock
    if (!uploadedHeaders.includes('Product Name') || !uploadedHeaders.includes('SKU')) {
      return res.status(400).json({ success: false, message: 'Invalid template format. Please download the template.' });
    }

    const categories = await Category.find({}, '_id name');
    const brands = await Brand.find({}, 'brandName');
    const existingSkus = await Product.find({}, 'sku');
    
    const categoryMap = {};
    categories.forEach(c => { categoryMap[c.name.toLowerCase()] = c._id; });
    
    const brandSet = new Set(brands.map(b => b.brandName.toLowerCase()));
    const skuSet = new Set(existingSkus.filter(p => p.sku).map(p => p.sku.toLowerCase()));

    const validRows = [];
    const invalidRows = [];
    const currentUploadSkus = new Set(); // to catch duplicates inside the file itself

    rawData.forEach((row, index) => {
      const rowNum = index + 2; // +1 for 0-index, +1 for header
      const name = row['Product Name']?.toString().trim();
      const sku = row['SKU']?.toString().trim();
      const categoryName = row['Category']?.toString().trim();
      const brandName = row['Brand']?.toString().trim();
      const price = parseFloat(row['Price']);
      const discount = parseFloat(row['Discount (%)']) || 0;
      const stock = parseInt(row['Stock'], 10);
      const rawStatus = row['Status']?.toString().trim();
      
      let status = 'Active';
      if (rawStatus && rawStatus.toLowerCase() === 'inactive') {
        status = 'Draft';
      } else if (rawStatus && rawStatus.toLowerCase() === 'active') {
        status = 'Active';
      }

      let errors = [];

      if (!name) errors.push('Missing product name');
      if (!sku) errors.push('Missing SKU');
      else {
        if (skuSet.has(sku.toLowerCase())) errors.push('Duplicate SKU (already exists in DB)');
        if (currentUploadSkus.has(sku.toLowerCase())) errors.push('Duplicate SKU (inside file)');
        currentUploadSkus.add(sku.toLowerCase());
      }

      let categoryId = null;
      if (!categoryName) {
        errors.push('Missing category');
      } else {
        categoryId = categoryMap[categoryName.toLowerCase()];
        if (!categoryId) errors.push('Category not found');
      }

      if (!brandName) {
        errors.push('Missing brand');
      } else {
        if (!brandSet.has(brandName.toLowerCase())) errors.push('Brand not found');
      }

      if (isNaN(price) || price <= 0) errors.push('Invalid price');
      if (isNaN(discount) || discount < 0 || discount > 100) errors.push('Discount must be between 0 and 100');
      if (isNaN(stock) || stock < 0) errors.push('Invalid stock');
      
      const parsedRow = {
        row: rowNum,
        name: name || '',
        sku: sku || '',
        category: categoryName || '',
        categoryId: categoryId,
        brand: brandName || '',
        price: isNaN(price) ? 0 : price,
        discount: isNaN(discount) ? 0 : discount,
        stock: isNaN(stock) ? 0 : stock,
        status: status
      };

      if (errors.length > 0) {
        invalidRows.push({ ...parsedRow, errors, isValid: false });
      } else {
        validRows.push({ ...parsedRow, isValid: true });
      }
    });

    res.json({
      success: true,
      data: {
        total: rawData.length,
        valid: validRows,
        invalid: invalidRows
      }
    });

  } catch (error) {
    console.error('Preview error:', error);
    res.status(500).json({ success: false, message: 'Failed to process file' });
  }
};

export const importProducts = async (req, res) => {
  try {
    const { products } = req.body;
    
    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ success: false, message: 'No products to import' });
    }

    const docsToInsert = products.map(p => ({
      name: p.name,
      sku: p.sku,
      category: p.categoryId,
      brand: p.brand,
      description: p.name, // Default description
      price: p.price,
      discount: p.discount,
      countInStock: p.stock,
      status: p.status,
      discountType: 'Percentage'
    }));

    // Use insertMany with ordered: false so it continues if one fails
    const result = await Product.insertMany(docsToInsert, { ordered: false });

    res.json({
      success: true,
      message: 'Products imported successfully',
      data: {
        total: products.length,
        imported: result.length,
        failed: products.length - result.length
      }
    });
  } catch (error) {
    if (error.code === 11000 || error.name === 'BulkWriteError') {
      // Some inserted, some failed
      const insertedCount = error.insertedDocs ? error.insertedDocs.length : 0;
      res.json({
        success: true,
        message: 'Partial import completed with some errors',
        data: {
          total: req.body.products.length,
          imported: insertedCount,
          failed: req.body.products.length - insertedCount
        }
      });
    } else {
      console.error('Import error:', error);
      res.status(500).json({ success: false, message: 'Failed to import products' });
    }
  }
};
