const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', '..', 'client', 'src', 'services', 'api.js');
let content = fs.readFileSync(file, 'utf8');

const addition = `
// -----------------------------------------------------
// OFFER APIs
// -----------------------------------------------------
const OFFER_API = \`\${API_BASE_URL}/offers\`;
export const getOffers = () => axios.get(OFFER_API);
export const createOffer = (data) => axios.post(OFFER_API, data);
export const updateOffer = (id, data) => axios.put(\`\${OFFER_API}/\${id}\`, data);
export const deleteOffer = (id) => axios.delete(\`\${OFFER_API}/\${id}\`);
`;

if (!content.includes('export const getOffers =')) {
  fs.appendFileSync(file, addition);
  console.log('Appended OFFER APIs successfully!');
} else {
  console.log('OFFER APIs already exist.');
}
