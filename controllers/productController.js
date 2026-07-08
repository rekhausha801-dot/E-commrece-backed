// Dummy data
const products = [
  { id: 1, name: 'Premium Wireless Headphones', price: 299.00 },
  { id: 2, name: 'Minimalist Smartwatch', price: 199.00 },
  { id: 3, name: 'Mechanical Keyboard', price: 149.00 },
  { id: 4, name: 'Ultra-thin Laptop Stand', price: 49.00 }
];

export const getProducts = (req, res) => {
  res.json({
    success: true,
    count: products.length,
    data: products
  });
};

export const getProductById = (req, res) => {
  const product = products.find(p => p.id === parseInt(req.params.id));
  
  if (!product) {
    return res.status(404).json({ success: false, error: 'Product not found' });
  }
  
  res.json({
    success: true,
    data: product
  });
};
