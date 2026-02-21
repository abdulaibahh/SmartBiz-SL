const db = require("../config/db");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// Helper function to check if subscription is expired and get status
async function checkAndUpdateSubscriptionStatus(businessId) {
  try {
    const result = await db.query(
      "SELECT trial_end, subscription_active, subscription_end_date FROM businesses WHERE id=$1",
      [businessId]
    );
    
    if (!result.rows.length) return { active: false };
    
    const biz = result.rows[0];
    const now = new Date();
    let trialEnd = biz.trial_end ? new Date(biz.trial_end) : null;
    
    // If no trial_end is set, create a 30-day trial automatically
    if (!trialEnd) {
      const newTrialEnd = new Date();
      newTrialEnd.setDate(newTrialEnd.getDate() + 30);
      
      await db.query(
        "UPDATE businesses SET trial_end = $1 WHERE id = $2",
        [newTrialEnd.toISOString(), businessId]
      );
      console.log(`✅ Auto-created 30-day trial for business ${businessId}`);
      trialEnd = newTrialEnd;
    }
    
    const endDate = biz.subscription_end_date ? new Date(biz.subscription_end_date) : null;
    
    // Check if there's a valid trial period
    if (!biz.subscription_active && trialEnd && now <= trialEnd) {
      const daysRemaining = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));
      return {
        active: true,
        isTrial: true,
        endDate: trialEnd,
        daysRemaining: daysRemaining,
        expired: false
      };
    }
    
    // If subscription exists and is active, check if it's expired
    if (biz.subscription_active && endDate && now > endDate) {
      await db.query(
        "UPDATE businesses SET subscription_active = false WHERE id = $1",
        [businessId]
      );
      return { 
        active: false, 
        expired: true, 
        endDate: endDate,
        message: "Subscription has expired"
      };
    }
    
    // If subscription is active
    if (biz.subscription_active) {
      const daysRemaining = endDate ? Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)) : 0;
      return {
        active: true,
        endDate: endDate,
        daysRemaining: daysRemaining > 0 ? daysRemaining : 0,
        expired: daysRemaining <= 0
      };
    }
    
    // No subscription and trial expired
    return {
      active: false,
      isTrial: false,
      endDate: trialEnd,
      daysRemaining: 0,
      expired: true
    };
  } catch (err) {
    console.error("Error in checkAndUpdateSubscriptionStatus:", err);
    throw err;
  }
}

exports.getStatus = async (req, res) => {
  try {
    const status = await checkAndUpdateSubscriptionStatus(req.user.business_id);
    
    res.json({
      active: status.active,
      expired: status.expired || false,
      daysRemaining: status.daysRemaining || 0,
      endDate: status.endDate,
      isTrial: status.isTrial || false,
      message: status.message || null
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch subscription" });
  }
};

exports.createCheckout = async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "SmartBiz Pro",
            },
            unit_amount: 1000,
            recurring: { interval: "month" },
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_URL}/subscription?success=true`,
      cancel_url: `${process.env.FRONTEND_URL}/subscription?cancel=true`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Checkout failed" });
  }
};
