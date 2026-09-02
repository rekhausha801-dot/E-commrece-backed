const fs = require('fs');
const path = 'C:/Users/Devi/Downloads/E-Commerce/E-Commerce/server/controllers/orderController.js';
let content = fs.readFileSync(path, 'utf8');

const regex = /const product = await Product\.findById\(item\.productId \|\| item\.product\);/g;
const replacement = `
      const idToSearch = item.productId || item.product;
      let product;
      try {
        product = await Product.findById(idToSearch);
      } catch (err) {
        if (err.name === 'CastError') {
           return res.status(400).json({ success: false, message: \`Product ID \${idToSearch} is invalid. If you are using old cart items, please clear your cart.\` });
        }
        throw err;
      }
`;

content = content.replace(regex, replacement);
fs.writeFileSync(path, content, 'utf8');

const path2 = 'C:/Users/Devi/Downloads/E-Commerce/E-Commerce/server/controllers/paymentController.js';
let content2 = fs.readFileSync(path2, 'utf8');
content2 = content2.replace(regex, replacement);
fs.writeFileSync(path2, content2, 'utf8');

console.log("Fixed CastError unhandled rejection");
