
const router = require("express").Router();
const db = require("../config/db");
const auth = require("../middlewares/auth");
const sub = require("../middlewares/subscription");
const role = require("../middlewares/role");
const PDFDocument = require("pdfkit");

router.post("/quick",
  auth,
  sub,
  role("owner","manager","cashier"),
  async(req,res)=>{
    const {total,paid,customer} = req.body;
    const debt = total - paid;

    await db.query(
      "INSERT INTO sales(business_id,total,paid,customer) VALUES($1,$2,$3,$4)",
      [req.user.business_id,total,paid,customer]
    );

    if(debt>0){
      await db.query(
        "INSERT INTO debts(business_id,customer,amount) VALUES($1,$2,$3)",
        [req.user.business_id,customer,debt]
      );
    }

    res.json({message:"Sale recorded"});
});

router.get("/all",
  auth,
  role("owner","manager"),
  async(req,res)=>{
    const sales = await db.query(
      "SELECT * FROM sales WHERE business_id=$1",
      [req.user.business_id]
    );
    res.json(sales.rows);
});

module.exports = router;
