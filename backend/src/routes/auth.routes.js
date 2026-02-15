const router = require("express").Router();
const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

/* ================= REGISTER BUSINESS OWNER ================= */

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, business_name } = req.body;

    const hashed = await bcrypt.hash(password, 10);

    // Create business
    const business = await db.query(
      "INSERT INTO businesses(name, subscription_active, trial_end) VALUES($1,false,NOW() + interval '30 days') RETURNING id",
      [business_name]
    );

    const business_id = business.rows[0].id;

    // Create owner user
    await db.query(
      "INSERT INTO users(name,email,password,role,business_id) VALUES($1,$2,$3,$4,$5)",
      [name, email, hashed, "owner", business_id]
    );

    res.json({ message: "Business created successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Registration failed" });
  }
});

/* ================= LOGIN ================= */

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await db.query(
      "SELECT * FROM users WHERE email=$1",
      [email]
    );

    if (!user.rows.length)
      return res.status(400).json({ message: "User not found" });

    const valid = await bcrypt.compare(
      password,
      user.rows[0].password
    );

    if (!valid)
      return res.status(400).json({ message: "Invalid password" });

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
    console.error(err);
    res.status(500).json({ message: "Login failed" });
  }
});

module.exports = router;
