const router = require("express").Router();
const db = require("../config/db");
const auth = require("../middlewares/auth");
const sub = require("../middlewares/subscription");

/* ================= QUICK SALE ================= */

router.post("/quick", auth, sub, async (req, res) => {
  try {
    const { total, paid, customer } = req.body;

    if (!total) {
      return res.status(400).json({ message: "Total amount required" });
    }

    const totalAmount = parseFloat(total);
    const paidAmount = parseFloat(paid) || 0;
    const debt = totalAmount - paidAmount;
    const customerName = customer || "Walk-in Customer";

    // Insert sale
    const sale = await db.query(
      "INSERT INTO sales(business_id, total, paid, customer) VALUES($1, $2, $3, $4) RETURNING id",
      [req.user.business_id, totalAmount, paidAmount, customerName]
    );

    // If there's debt, create debt record
    if (debt > 0) {
      await db.query(
        "INSERT INTO debts(business_id, customer, amount) VALUES($1, $2, $3)",
        [req.user.business_id, customerName, debt]
      );
    }

    res.json({ message: "Sale recorded", saleId: sale.rows[0].id });
  } catch (err) {
    console.error("Quick sale error:", err);
    res.status(500).json({ message: "Failed to record sale" });
  }
});

/* ================= GET ALL SALES ================= */

router.get("/all", auth, async (req, res) => {
  try {
    const sales = await db.query(
      "SELECT * FROM sales WHERE business_id=$1 ORDER BY created_at DESC",
      [req.user.business_id]
    );
    res.json(sales.rows);
  } catch (err) {
    console.error("Get sales error:", err);
    res.status(500).json({ message: "Failed to fetch sales" });
  }
});

module.exports = router;
