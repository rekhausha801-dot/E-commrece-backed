const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', '..', 'client', 'src', 'services', 'api.js');
let content = fs.readFileSync(file, 'utf8');

// The original file ended around the comment '// export const getProducts = () => axios.get(PRODUCT_API);'
const originalEndIndex = content.indexOf('// export const getProducts = () => axios.get(PRODUCT_API);');
if (originalEndIndex !== -1) {
  // truncate and replace
  content = content.substring(0, originalEndIndex);
  
  const addition = `
// -----------------------------------------------------
// PRODUCT APIs
// -----------------------------------------------------
const PRODUCT_API = \`\${API_BASE_URL}/products\`;

export const fetchProducts = () => axios.get(PRODUCT_API);
export const fetchProductById = (id) => axios.get(\`\${PRODUCT_API}/\${id}\`);
export const fetchProductsByCategory = (categoryId) => axios.get(\`\${PRODUCT_API}?category=\${categoryId}\`);
export const createProductApi = (data) => axios.post(PRODUCT_API, data);
export const updateProductApi = (id, data) => axios.put(\`\${PRODUCT_API}/\${id}\`, data);
export const deleteProductApi = (id) => axios.delete(\`\${PRODUCT_API}/\${id}\`);
`;
  
  fs.writeFileSync(file, content + addition);
  console.log('Fixed api.js successfully!');
} else {
  console.log('Could not find original end index');
}
