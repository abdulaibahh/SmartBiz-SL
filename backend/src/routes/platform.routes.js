const router = require("express").Router();
const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

/* ================= PLATFORM ADMIN LOGIN ================= */

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const admin = await db.query(
    "SELECT * FROM platform_admins WHERE email=$1",
    [email]
  );

  if (!admin.rows.length)
    return res.status(400).json({ message: "Admin not found" });

  const valid = await bcrypt.compare(password, admin.rows[0].password);
  if (!valid)
    return res.status(400).json({ message: "Invalid password" });

  const token = jwt.sign(
    { id: admin.rows[0].id, role: "platform_admin" },
    process.env.JWT_SECRET
  );

  res.json({ token });
});

/* ================= STATS ================= */

router.get("/stats", async (req, res) => {
  const totalBusinesses = await db.query(
    "SELECT COUNT(*) FROM businesses"
  );

  const activeSubs = await db.query(
    "SELECT COUNT(*) FROM businesses WHERE subscription_active=true"
  );

  const totalSales = await db.query(
    "SELECT SUM(total) FROM sales"
  );

  res.json({
    totalBusinesses: totalBusinesses.rows[0].count,
    activeSubscriptions: activeSubs.rows[0].count,
    totalRevenueAcrossPlatform: totalSales.rows[0].sum || 0
  });
});

/* ================= LIST BUSINESSES ================= */

router.get("/businesses", async (req, res) => {
  const businesses = await db.query(
    "SELECT id,name,subscription_active,trial_end FROM businesses"
  );

  res.json(businesses.rows);
});

/* ================= PLATFORM REVENUE ================= */

router.get("/revenue", async (req, res) => {
  const result = await db.query(
    "SELECT COUNT(*) FROM businesses WHERE subscription_active=true"
  );

  const monthlyPrice = 19; // change to your real plan price

  res.json({
    payingBusinesses: result.rows[0].count,
    estimatedMonthlyRevenue:
      result.rows[0].count * monthlyPrice
  });
});

module.exports = router;
