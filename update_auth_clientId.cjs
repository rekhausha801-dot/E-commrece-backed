const fs = require('fs');
const authPath = 'C:/Users/Devi/Downloads/E-Commerce/E-Commerce/server/controllers/authController.js';
let content = fs.readFileSync(authPath, 'utf8');

const clientId = '"830862223596-dpe9lhl67h3tndc0n47888qec4j7cpcl.apps.googleusercontent.com"';

content = content.replace(
    /process\.env\.GOOGLE_CLIENT_ID/g,
    `(process.env.GOOGLE_CLIENT_ID || ${clientId})`
);

fs.writeFileSync(authPath, content, 'utf8');
console.log("authController updated with fallback Client ID");
