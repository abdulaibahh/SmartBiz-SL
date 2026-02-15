const db = require("../config/db");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

exports.getStatus = async (req, res) => {
  try {
    const result = await db.query(
      "SELECT * FROM subscriptions WHERE business_id=$1 ORDER BY created_at DESC LIMIT 1",
      [req.user.bid]
    );

    const sub = result.rows[0];

    if (!sub) {
      return res.json({
        active: false,
        trialEnds: null,
        nextBilling: null,
      });
    }

    res.json({
      active: sub.active,
      trialEnds: sub.trial_end,
      nextBilling: sub.next_billing,
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
