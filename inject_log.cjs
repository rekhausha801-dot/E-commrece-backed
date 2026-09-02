const fs = require('fs');
const path = 'C:/Users/Devi/Downloads/E-Commerce/E-Commerce/server/controllers/orderController.js';
let content = fs.readFileSync(path, 'utf8');

// replace "res.status(500).json({ success: false, message: error.message });" with a file write
const oldCatch = /res\.status\(500\)\.json\(\{ success: false, message: error\.message \}\);/g;
const newCatch = "require('fs').appendFileSync('error_log.txt', error.stack + '\\n\\n'); res.status(500).json({ success: false, message: error.message });";

content = content.replace(oldCatch, newCatch);
fs.writeFileSync(path, content, 'utf8');

const path2 = 'C:/Users/Devi/Downloads/E-Commerce/E-Commerce/server/controllers/paymentController.js';
let content2 = fs.readFileSync(path2, 'utf8');
content2 = content2.replace(oldCatch, newCatch);
fs.writeFileSync(path2, content2, 'utf8');

console.log("Injected error logging");
