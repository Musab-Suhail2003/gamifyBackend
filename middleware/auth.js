const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();
const jwtSecret = process.env.JWT_SECRET;

module.exports = function (req, res, next) {
  console.log(req.header);
  const token = req.header('Authorization')?.split(' ')[1]; 
  // Extract token from Bearer header
  if (!token) return res.status(401).json({ error: 'Message from auth.js Access denied. No token provided.' });

  try {
    const decoded = jwt.verify(token, jwtSecret); // Verify the token
    req.user = decoded; // Attach the decoded payload (userId, etc.) to the request object
    next(); // Pass control to the next middleware or route handler
  } catch (err) {
    res.status(401).json({ error: 'Message form auth.js Invalid token.' });
  }
};
