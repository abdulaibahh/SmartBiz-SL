const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) return res.status(401).json({ message: "No token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "platform_admin")
      return res.status(403).json({ message: "Access denied" });

    req.admin = decoded;
    next();
  } catch {
    res.status(403).json({ message: "Invalid token" });
  }
};

const platformAuth = require("../middlewares/platformAuth");

router.get("/stats", platformAuth, async (req, res) => { ... });
router.get("/businesses", platformAuth, async (req, res) => { ... });
router.get("/revenue", platformAuth, async (req, res) => { ... });
