const fs = require('fs');
const path = 'C:/Users/Devi/Downloads/E-Commerce/E-Commerce/server/controllers/orderController.js';
let content = fs.readFileSync(path, 'utf8');

const regex = /catch \(error\) \{[\s\S]*?res\.status\(500\)\.json\(\{ success: false, message: error\.message \}\);\s*\}/g;
const newCatch = `catch (error) {
    const fs = await import('fs');
    fs.appendFileSync('error_log.txt', error.stack + '\\n\\n');
    res.status(500).json({ success: false, message: error.message, stack: error.stack });
}`;

content = content.replace(regex, newCatch);
fs.writeFileSync(path, content, 'utf8');

const path2 = 'C:/Users/Devi/Downloads/E-Commerce/E-Commerce/server/controllers/paymentController.js';
let content2 = fs.readFileSync(path2, 'utf8');
content2 = content2.replace(regex, newCatch);
fs.writeFileSync(path2, content2, 'utf8');

console.log("Updated catch block to return stack trace in API response");
