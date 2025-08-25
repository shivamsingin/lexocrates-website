const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try {
    const bearer = req.header('Authorization')?.replace('Bearer ', '');
    const cookieToken = req.cookies?.session;
    const token = bearer || cookieToken;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

module.exports = authMiddleware;
