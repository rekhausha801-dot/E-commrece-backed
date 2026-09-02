const fs = require('fs');
const authPath = 'C:/Users/Devi/Downloads/E-Commerce/E-Commerce/server/controllers/authController.js';
let content = fs.readFileSync(authPath, 'utf8');

const oldGoogleAuth = `    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID",
    });
    
    const { email, name, picture, sub } = ticket.getPayload();`;

const newGoogleAuth = `    // Fetch user profile using access token
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: \`Bearer \${token}\` }
    });
    
    if (!response.ok) {
      throw new Error("Failed to fetch user profile from Google");
    }
    
    const { email, name, picture, sub } = await response.json();`;

content = content.replace(oldGoogleAuth, newGoogleAuth);
fs.writeFileSync(authPath, content, 'utf8');
console.log("authController updated for access_token");
