const fs = require('fs');
const path = '../server/services/reports.service.js';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  "Order.distinct('customer.customerId', currentMatch),", 
  "User.countDocuments({ role: 'customer', createdAt: { $gte: currentDates.start, $lte: currentDates.end } }),"
);

content = content.replace(
  "Order.distinct('customer.customerId', prevMatch)", 
  "User.countDocuments({ role: 'customer', createdAt: { $gte: previousDates.start, $lte: previousDates.end } })"
);

content = content.replace('const currCustCount = currentCustomers.length;', '');
content = content.replace('const prevCustCount = prevCustomers.length;', '');

content = content.replace(
  'const [currentStats, prevStats, currentCustomers, prevCustomers] = await Promise.all([',
  'const [currentStats, prevStats, currCustCount, prevCustCount] = await Promise.all(['
);

fs.writeFileSync(path, content);
