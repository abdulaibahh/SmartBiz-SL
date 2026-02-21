const db = require("../config/db");

module.exports = async (req, res, next) => {
  try {
    const result = await db.query(
      "SELECT trial_end, subscription_active, subscription_end_date FROM businesses WHERE id=$1",
      [req.user.business_id]
    );

    // If no business found, block access
    if (!result.rows.length) {
      return res.status(402).json({ 
        message: "Business not found",
        code: "BUSINESS_NOT_FOUND"
      });
    }

    const biz = result.rows[0];
    const now = new Date();
    let trialEnd = biz.trial_end ? new Date(biz.trial_end) : null;
    const subscriptionEndDate = biz.subscription_end_date ? new Date(biz.subscription_end_date) : null;

    // If no trial_end is set, create a 30-day trial automatically
    if (!trialEnd) {
      const newTrialEnd = new Date();
      newTrialEnd.setDate(newTrialEnd.getDate() + 30);
      
      await db.query(
        "UPDATE businesses SET trial_end = $1 WHERE id = $2",
        [newTrialEnd, req.user.business_id]
      );
      console.log(`✅ Auto-created 30-day trial for business ${req.user.business_id}`);
      trialEnd = newTrialEnd;
    }

    // Allow if subscription is active and not expired
    if (biz.subscription_active && subscriptionEndDate && now <= subscriptionEndDate) {
      return next();
    }
    
    // Allow if subscription is active but no end date set
    if (biz.subscription_active && !subscriptionEndDate) {
      return next();
    }
    
    // Allow if trial hasn't ended
    if (trialEnd && trialEnd > now) {
      return next();
    }

    // Trial and subscription both expired - block access
    return res.status(402).json({ 
      message: "Subscription expired. Please renew to continue using SmartBiz.",
      code: "SUBSCRIPTION_EXPIRED"
    });
  } catch (err) {
    // If table doesn't exist or other error, allow for now
    console.error("Subscription check error:", err.message);
    next();
  }
};
