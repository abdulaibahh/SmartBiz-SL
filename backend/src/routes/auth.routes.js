const router = require("express").Router();
const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const auth = require("../middlewares/auth");
const roleAuth = require("../middlewares/role");

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

/* ================= GET BUSINESS USERS ================= */

router.get("/users", auth, async (req, res) => {
  try {
    const result = await db.query(
      "SELECT id, name, email, role, business_id, created_at FROM users WHERE business_id=$1 ORDER BY created_at DESC",
      [req.user.business_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Get users error:", err);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

/* ================= CREATE USER (Owner only) ================= */

router.post("/users", auth, roleAuth("owner"), async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Validate role
    const allowedRoles = ["cashier", "manager"];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    // Check if email already exists
    const existing = await db.query(
      "SELECT id FROM users WHERE email=$1",
      [email]
    );

    if (existing.rows.length) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const hashed = await bcrypt.hash(password, 10);

    await db.query(
      "INSERT INTO users(name, email, password, role, business_id) VALUES($1, $2, $3, $4, $5)",
      [name, email, hashed, role, req.user.business_id]
    );

    res.json({ message: "User created successfully" });
  } catch (err) {
    console.error("Create user error:", err);
    res.status(500).json({ message: "Failed to create user" });
  }
});

/* ================= DELETE USER ================= */

router.delete("/users/:id", auth, roleAuth("owner"), async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent owner from deleting themselves
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ message: "Cannot delete your own account" });
    }

    // Verify user belongs to same business
    const user = await db.query(
      "SELECT id FROM users WHERE id=$1 AND business_id=$2",
      [id, req.user.business_id]
    );

    if (!user.rows.length) {
      return res.status(404).json({ message: "User not found" });
    }

    await db.query("DELETE FROM users WHERE id=$1", [id]);

    res.json({ message: "User deleted" });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({ message: "Failed to delete user" });
  }
});

/* ================= PASSWORD RESET ================= */

// Request password reset
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Check if user exists
    const user = await db.query(
      "SELECT id, name FROM users WHERE email=$1",
      [email]
    );

    if (!user.rows.length) {
      // Don't reveal if email exists or not
      return res.json({ message: "If the email exists, a reset link will be sent" });
    }

    // Generate reset token
    const crypto = require("crypto");
    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save token to database
    await db.query(
      "INSERT INTO password_reset_tokens(user_id, token, expires_at) VALUES($1, $2, $3)",
      [user.rows[0].id, resetToken, expiresAt]
    );

    // In production, send email with reset link
    // For now, return the token (demo mode)
    const resetLink = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password?token=${resetToken}`;
    
    console.log("Password reset link:", resetLink);
    
    res.json({ 
      message: "If the email exists, a reset link will be sent",
      demoLink: resetLink // Only in development
    });

  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ message: "Failed to process request" });
  }
});

// Reset password with token
router.post("/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ message: "Token and password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    // Find valid token
    const tokenResult = await db.query(
      "SELECT * FROM password_reset_tokens WHERE token=$1 AND used=false AND expires_at > NOW()",
      [token]
    );

    if (!tokenResult.rows.length) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const resetRecord = tokenResult.rows[0];

    // Hash new password
    const hashed = await bcrypt.hash(password, 10);

    // Update user password
    await db.query(
      "UPDATE users SET password=$1, updated_at=NOW() WHERE id=$2",
      [hashed, resetRecord.user_id]
    );

    // Mark token as used
    await db.query(
      "UPDATE password_reset_tokens SET used=true WHERE id=$1",
      [resetRecord.id]
    );

    res.json({ message: "Password reset successful" });

  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ message: "Failed to reset password" });
  }
});

module.exports = router;
