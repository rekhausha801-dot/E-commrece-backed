const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', '..', 'client', 'src', 'services', 'api.js');
let content = fs.readFileSync(file, 'utf8');

const targetStr = `// -----------------------------------------------------
// PRODUCT APIs (Add here later)
// -----------------------------------------------------
const PRODUCT_API = \`\${API_BASE_URL}/products\`;

// -----------------------------------------------------
// PRODUCT APIs
// -----------------------------------------------------
const PRODUCT_API = \`\${API_BASE_URL}/products\`;`;

const replacementStr = `// -----------------------------------------------------
// PRODUCT APIs
// -----------------------------------------------------
const PRODUCT_API = \`\${API_BASE_URL}/products\`;`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replacementStr);
  fs.writeFileSync(file, content);
  console.log('Fixed duplicate PRODUCT_API declaration!');
} else {
  // Try a more robust regex replacement just in case of whitespace differences
  const regex = /\/\/\s*-+\s*\/\/\s*PRODUCT APIs \(Add here later\)\s*\/\/\s*-+\s*const PRODUCT_API = `\$\{API_BASE_URL\}\/products`;\s*\/\/\s*-+\s*\/\/\s*PRODUCT APIs\s*\/\/\s*-+\s*const PRODUCT_API = `\$\{API_BASE_URL\}\/products`;/g;
  
  if (regex.test(content)) {
    content = content.replace(regex, replacementStr);
    fs.writeFileSync(file, content);
    console.log('Fixed duplicate PRODUCT_API declaration using regex!');
  } else {
     console.log('Could not find the exact duplicate string.');
  }
}
