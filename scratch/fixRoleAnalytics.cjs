const fs = require('fs');
const path = '../server/controllers/analyticsController.js';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/{ role: 'customer'/g, "{ role: { $$in: ['user', 'customer'] }");

fs.writeFileSync(path, content);
