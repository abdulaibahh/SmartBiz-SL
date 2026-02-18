
const db = require("../config/db");

module.exports = async (req, res, next) => {
  try {
    const result = await db.query(
      "SELECT trial_end, subscription_active FROM businesses WHERE id=$1",
      [req.user.business_id]
    );

    // If no business found, allow for now
    if (!result.rows.length) {
      return next();
    }

    const biz = result.rows[0];
    const now = new Date();

    // Allow if subscription is active
    if (biz.subscription_active) return next();
    
    // Allow if trial hasn't ended
    if (biz.trial_end && new Date(biz.trial_end) > now) return next();

    return res.status(402).json({ message: "Subscription expired" });
  } catch (err) {
    // If table doesn't exist or other error, allow for now
    console.error("Subscription check error:", err.message);
    next();
  }
};
