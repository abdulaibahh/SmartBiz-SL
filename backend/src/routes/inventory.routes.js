
const router = require("express").Router();
const db = require("../config/db");
const auth = require("../middlewares/auth");
const sub = require("../middlewares/subscription");

router.post("/supplier-order", auth, sub, async(req,res)=>{
  const {product,quantity} = req.body;

  const existing = await db.query(
    "SELECT * FROM inventory WHERE business_id=$1 AND product=$2",
    [req.user.business_id,product]
  );

  if(existing.rows.length){
    await db.query(
      "UPDATE inventory SET quantity=quantity+$1 WHERE business_id=$2 AND product=$3",
      [quantity,req.user.business_id,product]
    );
  }else{
    await db.query(
      "INSERT INTO inventory(business_id,product,quantity) VALUES($1,$2,$3)",
      [req.user.business_id,product,quantity]
    );
  }

  res.json({message:"Inventory updated"});
});

module.exports = router;
