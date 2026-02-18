const router = require("express").Router();
const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

/* ================= REGISTER BUSINESS OWNER ================= */

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, business_name } = req.body;

    if (!name || !email || !password || !business_name) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if user already exists
    const existingUser = await db.query(
      "SELECT id FROM users WHERE email=$1",
      [email]
    );

    if (existingUser.rows.length) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashed = await bcrypt.hash(password, 10);

    // Create business
    const business = await db.query(
      "INSERT INTO businesses(name, subscription_active, trial_end) VALUES($1, false, NOW() + interval '30 days') RETURNING id",
      [business_name]
    );

    const business_id = business.rows[0].id;

    // Create owner user
    await db.query(
      "INSERT INTO users(name, email, password, role, business_id) VALUES($1, $2, $3, 'owner', $4)",
      [name, email, hashed, business_id]
    );

    res.json({ message: "Business created successfully" });

  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Registration failed" });
  }
});

/* ================= LOGIN ================= */

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const user = await db.query(
      "SELECT * FROM users WHERE email=$1",
      [email]
    );

    if (!user.rows.length) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const valid = await bcrypt.compare(password, user.rows[0].password);

    if (!valid) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      {
        id: user.rows[0].id,
        role: user.rows[0].role,
        business_id: user.rows[0].business_id
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Login failed" });
  }
});

module.exports = router;
