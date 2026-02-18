const router = require("express").Router();
const db = require("../config/db");
const auth = require("../middlewares/auth");

/* ================= GET ALL DEBTS ================= */

router.get("/all", auth, async (req, res) => {
  try {
    const debts = await db.query(
      `SELECT d.*, c.name as customer_name, c.phone as customer_phone
       FROM debts d
       LEFT JOIN customers c ON d.customer_id = c.id
       WHERE d.business_id=$1 
       ORDER BY d.created_at DESC`,
      [req.user.business_id]
    );
    res.json(debts.rows);
  } catch (err) {
    console.error("Get debts error:", err);
    res.status(500).json({ message: "Failed to fetch debts" });
  }
});

/* ================= GET CUSTOMER DEBT ================= */

router.get("/customer/:customerId", auth, async (req, res) => {
  try {
    const { customerId } = req.params;
    
    const customer = await db.query(
      "SELECT * FROM customers WHERE id=$1 AND business_id=$2",
      [customerId, req.user.business_id]
    );
    
    if (!customer.rows.length) {
      return res.status(404).json({ message: "Customer not found" });
    }
    
    const debts = await db.query(
      "SELECT * FROM debts WHERE customer_id=$1 AND business_id=$2 ORDER BY created_at DESC",
      [customerId, req.user.business_id]
    );
    
    const totalDebt = debts.rows.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);
    const totalPaid = debts.rows.reduce((sum, d) => sum + (parseFloat(d.payment_amount) || 0), 0);
    const balance = totalDebt - totalPaid;
    
    res.json({
      customer: customer.rows[0],
      totalDebt,
      totalPaid,
      balance,
      debts: debts.rows
    });
  } catch (err) {
    console.error("Get customer debt error:", err);
    res.status(500).json({ message: "Failed to fetch customer debt" });
  }
});

/* ================= RECORD DEBT PAYMENT ================= */

router.post("/payment", auth, async (req, res) => {
  try {
    const { debtId, amount, notes } = req.body;
    
    if (!debtId || !amount) {
      return res.status(400).json({ message: "Debt ID and amount are required" });
    }
    
    const debt = await db.query(
      "SELECT * FROM debts WHERE id=$1 AND business_id=$2",
      [debtId, req.user.business_id]
    );
    
    if (!debt.rows.length) {
      return res.status(404).json({ message: "Debt not found" });
    }
    
    const debtRecord = debt.rows[0];
    const paymentAmount = parseFloat(amount);
    const currentAmount = parseFloat(debtRecord.amount);
    const currentPaid = parseFloat(debtRecord.payment_amount) || 0;
    const newPaid = currentPaid + paymentAmount;
    const newBalance = currentAmount - newPaid;
    
    let status = "partial";
    if (newBalance <= 0) {
      status = "paid";
    }
    
    await db.query(
      "UPDATE debts SET payment_amount=$1, status=$2, updated_at=NOW() WHERE id=$3",
      [newPaid, status, debtId]
    );
    
    res.json({ 
      message: "Payment recorded successfully",
      paymentAmount,
      newBalance: Math.max(0, newBalance),
      status
    });
  } catch (err) {
    console.error("Debt payment error:", err);
    res.status(500).json({ message: "Failed to record payment" });
  }
});

/* ================= GET DEBT SUMMARY ================= */

router.get("/summary", auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT 
        COUNT(*) as total_debts,
        COALESCE(SUM(amount), 0) as total_amount,
        COALESCE(SUM(payment_amount), 0) as total_paid,
        COALESCE(SUM(amount - COALESCE(payment_amount, 0)), 0) as total_outstanding,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN status = 'partial' THEN 1 END) as partial_count,
        COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_count
       FROM debts 
       WHERE business_id=$1`,
      [req.user.business_id]
    );
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Debt summary error:", err);
    res.status(500).json({ message: "Failed to fetch debt summary" });
  }
});

module.exports = router;
