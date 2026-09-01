const fs = require('fs');
const path = '../client/src/pages/admin/CustomerManagement.jsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/const mockCustomers = \[[\s\S]*?\];/m, '');
fs.writeFileSync(path, content);
