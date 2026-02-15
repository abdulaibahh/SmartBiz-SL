
const db = require("../config/db");

module.exports = async(req,res,next)=>{
  const result = await db.query(
    "SELECT trial_end, subscription_active FROM businesses WHERE id=$1",
    [req.user.business_id]
  );

  const biz = result.rows[0];
  const now = new Date();

  if(biz.subscription_active) return next();
  if(new Date(biz.trial_end) > now) return next();

  return res.status(402).json({message:"Subscription expired"});
};
