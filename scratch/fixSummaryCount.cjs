const fs = require('fs');
const path = '../server/services/reports.service.js';
let content = fs.readFileSync(path, 'utf8');

// The original strings
const target1 = "User.countDocuments({ role: 'customer', createdAt: { $gte: currentDates.start, $lte: currentDates.end } })";
const target2 = "User.countDocuments({ role: 'customer', createdAt: { $gte: previousDates.start, $lte: previousDates.end } })";

// The new strings
const replacement1 = "User.countDocuments({ role: 'customer', createdAt: { $lte: currentDates.end } })";
const replacement2 = "User.countDocuments({ role: 'customer', createdAt: { $lte: previousDates.end } })";

content = content.replace(target1, replacement1);
content = content.replace(target2, replacement2);

fs.writeFileSync(path, content);
