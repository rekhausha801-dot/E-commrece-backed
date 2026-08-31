const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'controllers/orderController.js');
let content = fs.readFileSync(file, 'utf8');

const targetStr = "    const { search, orderStatus, paymentStatus, paymentMethod } = req.query;\r\n\r\n    let query = {};";
const replaceStr = "    const { search, orderStatus, paymentStatus, paymentMethod, user } = req.query;\r\n\r\n    let query = {};\r\n\r\n    if (user) query['customer.customerId'] = user;";

if (content.includes(targetStr)) {
    content = content.replace(targetStr, replaceStr);
    fs.writeFileSync(file, content);
    console.log('Replaced with CRLF');
} else {
    const targetStr2 = "    const { search, orderStatus, paymentStatus, paymentMethod } = req.query;\n\n    let query = {};";
    const replaceStr2 = "    const { search, orderStatus, paymentStatus, paymentMethod, user } = req.query;\n\n    let query = {};\n\n    if (user) query['customer.customerId'] = user;";
    if (content.includes(targetStr2)) {
        content = content.replace(targetStr2, replaceStr2);
        fs.writeFileSync(file, content);
        console.log('Replaced with LF');
    } else {
        console.log('Target string not found');
    }
}
