const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) return res.status(401).json({ message: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach user info to request
    req.user = {
      id: decoded.id,
      role: decoded.role,
      business_id: decoded.business_id
    };
    
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};
