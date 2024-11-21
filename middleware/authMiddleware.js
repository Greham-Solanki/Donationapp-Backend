const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (!authHeader) {
    console.error('Server-side: No Authorization header found');
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  // Split 'Bearer <token>' to extract the token
  const token = authHeader.split(' ')[1];
  console.log("Server-side token:", token);

  if (!token) {
    return res.status(401).json({ msg: 'Token is not valid' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded user:', decoded); // Log decoded user
    req.user = decoded;  // Attach the decoded user information to the request
    console.log('Authenticated user:', req.user);
    next();
  } catch (error) {
    console.error('Server-side: Token validation error:', error.message);
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

module.exports = authMiddleware;
