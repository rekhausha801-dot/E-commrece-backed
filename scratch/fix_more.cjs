const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', '..', 'client', 'src', 'services', 'api.js');
let content = fs.readFileSync(file, 'utf8');

const addition = `
// -----------------------------------------------------
// BANNER APIs
// -----------------------------------------------------
const BANNER_API = \`\${API_BASE_URL}/banners\`;
export const getBanners = () => axios.get(BANNER_API);
export const createBanner = (data) => axios.post(BANNER_API, data);
export const updateBanner = (id, data) => axios.put(\`\${BANNER_API}/\${id}\`, data);
export const deleteBanner = (id) => axios.delete(\`\${BANNER_API}/\${id}\`);
export const toggleBannerStatus = (id, status) => axios.patch(\`\${BANNER_API}/\${id}/status\`, { status });

export const fetchNextSku = () => axios.get(\`\${PRODUCT_API}/next-sku\`);
`;

if (!content.includes('export const fetchNextSku =')) {
  fs.appendFileSync(file, addition);
  console.log('Appended BANNER APIs and fetchNextSku successfully!');
} else {
  console.log('BANNER APIs already exist.');
}
