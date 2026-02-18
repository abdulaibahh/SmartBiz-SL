const router = require("express").Router();
const db = require("../config/db");
const auth = require("../middlewares/auth");

/* ================= GET ALL DEBTS ================= */

router.get("/all", auth, async (req, res) => {
  try {
    const debts = await db.query(
      "SELECT * FROM debts WHERE business_id=$1 ORDER BY created_at DESC",
      [req.user.business_id]
    );
    res.json(debts.rows);
  } catch (err) {
    console.error("Get debts error:", err);
    res.status(500).json({ message: "Failed to fetch debts" });
  }
});

module.exports = router;
