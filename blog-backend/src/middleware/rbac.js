// Role-based access control middleware
// Usage: rbac(['admin', 'editor'])

module.exports = function rbac(allowedRoles = []) {
  return (req, res, next) => {
    try {
      const userRole = req.user?.role;
      if (!userRole) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }
      if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
        return res.status(403).json({ success: false, message: 'Forbidden: insufficient role' });
      }
      next();
    } catch (err) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
  };
};


