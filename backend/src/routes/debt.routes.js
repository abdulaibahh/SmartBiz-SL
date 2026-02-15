
const router = require("express").Router();
const db = require("../config/db");
const auth = require("../middlewares/auth");

router.get("/all", auth, async(req,res)=>{
  const debts = await db.query(
    "SELECT * FROM debts WHERE business_id=$1",
    [req.user.business_id]
  );
  res.json(debts.rows);
});

module.exports = router;
