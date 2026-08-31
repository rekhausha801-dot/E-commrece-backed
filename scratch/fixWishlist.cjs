const fs = require('fs');
const path = '../client/src/pages/customer/Wishlist.jsx';
let content = fs.readFileSync(path, 'utf8');

// Remove the dummy recommended array
content = content.replace(/const recommended = \[[\s\S]*?\];/m, '');

// Remove the JSX block rendering the dummy recommended array
const regexJSX = /\{\/\* Recommended \*\/\}\s*<div style=\{\{ marginBottom: '40px' \}\}>[\s\S]*?<\/div>\s*<\/div>/m;
content = content.replace(regexJSX, '');

fs.writeFileSync(path, content);
