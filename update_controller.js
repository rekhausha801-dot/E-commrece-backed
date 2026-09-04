const fs = require('fs');
const file = 'c:/Users/Devi/Downloads/E-Commerce/E-Commerce/server/src/controllers/banner.controller.js';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/const \{ title, description, type, textPosition, placement, link, status, startDate, endDate, fontSize, specialLayout \} = req.body;/g, 'const { title, description, type, textPosition, placement, link, status, startDate, endDate, fontSize, specialLayout, line1Text, line1Color, line1Size, line2Text, line2Color, line2Size, line3Text, line3Color, line3Size } = req.body;');
content = content.replace(/specialLayout: specialLayout === 'true' \|\| specialLayout === true,/g, 'specialLayout: specialLayout === \'true\' || specialLayout === true,\n      line1Text, line1Color, line1Size,\n      line2Text, line2Color, line2Size,\n      line3Text, line3Color, line3Size,');
fs.writeFileSync(file, content);
