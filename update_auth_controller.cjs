const fs = require('fs');

const authPath = 'C:/Users/Devi/Downloads/E-Commerce/E-Commerce/server/controllers/authController.js';
let content = fs.readFileSync(authPath, 'utf8');

// Add import if not present
if (!content.includes('google-auth-library')) {
    content = content.replace(
        "import User from \"../models/User.js\";",
        "import User from \"../models/User.js\";\nimport { OAuth2Client } from \"google-auth-library\";"
    );
}

// Add googleAuth controller at the end
const googleAuthCode = `\n
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID");

export const googleAuth = async (req, res) => {
  try {
    const { token } = req.body;
    
    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID",
    });
    
    const { email, name, picture, sub } = ticket.getPayload();
    
    // Check if user exists
    let user = await User.findOne({ email });
    
    if (user) {
      // User exists, log them in
      const tokenStr = generateToken(user._id);
      return res.status(200).json({
        success: true,
        message: "Login successful",
        token: tokenStr,
        user: {
          _id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
        },
      });
    } else {
      // Create new user
      // Generate a random secure password for Google users
      const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(randomPassword, salt);
      
      user = await User.create({
        fullName: name,
        email,
        password: hashedPassword,
        profileImage: picture,
        provider: 'google',
        termsAccepted: true
      });
      
      const tokenStr = generateToken(user._id);
      return res.status(201).json({
        success: true,
        message: "Registration and login successful",
        token: tokenStr,
        user: {
          _id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
        },
      });
    }
  } catch (error) {
    console.error("Google auth error:", error);
    res.status(500).json({
      success: false,
      message: "Google authentication failed",
    });
  }
};
`;

if (!content.includes('export const googleAuth')) {
    content += googleAuthCode;
    fs.writeFileSync(authPath, content, 'utf8');
    console.log("authController updated");
} else {
    console.log("googleAuth already exists");
}
