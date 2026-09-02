const fs = require('fs');
const path = 'C:/Users/Devi/Downloads/E-Commerce/E-Commerce/server/controllers/orderController.js';
let content = fs.readFileSync(path, 'utf8');

// Fix req.user.name to req.user.fullName
content = content.replace(/name: req\.user\.name/g, 'name: req.user.fullName || req.user.name');
content = content.replace(/phone: req\.user\.phoneNumber/g, 'phone: req.user.phoneNumber || req.user.phone');

fs.writeFileSync(path, content, 'utf8');
console.log("Fixed name reference in orderController.js");
