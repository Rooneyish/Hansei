const isAdmin = (req, res, next) => {
 console.log(req.user.username, req.user.role);
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: "Access denied. Admins only." });
  }
};

module.exports = isAdmin;