const fs = require('fs');
const authPath = 'C:/Users/Devi/Downloads/E-Commerce/E-Commerce/server/controllers/authController.js';
let content = fs.readFileSync(authPath, 'utf8');

const oldGoogleAuthCodeStart = `const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID");

export const googleAuth = async (req, res) => {`;

const newGoogleAuth = `const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleAuth = async (req, res) => {
  try {
    const { credential } = req.body;
    
    if (!credential) {
      return res.status(400).json({ success: false, message: "Missing credential" });
    }
    
    // Verify Google ID token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(400).json({ success: false, message: "Invalid Google token" });
    }
    
    const { email, name, picture, sub, email_verified } = payload;
    
    if (!email || !email_verified) {
      return res.status(400).json({ success: false, message: "Unverified or missing email" });
    }
    
    // Check if user exists
    let user = await User.findOne({ email });
    
    if (user) {
      // CASE 2 & 3: Link if needed
      let updated = false;
      if (!user.googleId) {
        user.googleId = sub;
        updated = true;
      }
      if (!user.provider || user.provider === 'local') {
        user.provider = 'google';
        updated = true;
      }
      if (!user.profileImage && picture) {
        user.profileImage = picture;
        updated = true;
      }
      
      if (updated) {
        await user.save();
      }
      
      const tokenStr = generateToken(user._id);
      return res.status(200).json({
        success: true,
        message: "Google login successful",
        token: tokenStr,
        user: {
          _id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
        },
      });
    } else {
      // CASE 1: Create new user
      const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(randomPassword, salt);
      
      user = await User.create({
        fullName: name,
        email,
        password: hashedPassword,
        profileImage: picture,
        googleId: sub,
        provider: 'google',
        termsAccepted: true
      });
      
      const tokenStr = generateToken(user._id);
      return res.status(201).json({
        success: true,
        message: "Google login successful",
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
    res.status(401).json({
      success: false,
      message: "Google authentication failed",
    });
  }
};
`;

// We will use regex to replace the entire googleAuth function
const regex = /const client = new OAuth2Client[\s\S]*?export const googleAuth = async[\s\S]*?};\n/g;

if (regex.test(content)) {
    content = content.replace(regex, newGoogleAuth);
    fs.writeFileSync(authPath, content, 'utf8');
    console.log("authController updated with strict logic");
} else {
    console.log("Regex not found!");
}
