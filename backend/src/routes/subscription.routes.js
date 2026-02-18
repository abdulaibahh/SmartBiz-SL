const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const db = require("../config/db");
const auth = require("../middlewares/auth");

// Get subscription status
router.get("/status", auth, async (req, res) => {
  try {
    // Get from businesses table instead
    const result = await db.query(
      "SELECT subscription_active, trial_end FROM businesses WHERE id=$1",
      [req.user.business_id]
    );

    if (!result.rows.length) {
      return res.json({ active: false, trialEnds: null, nextBilling: null });
    }

    const biz = result.rows[0];
    res.json({
      active: biz.subscription_active,
      trialEnds: biz.trial_end,
      nextBilling: null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch subscription" });
  }
});

// Create checkout session
router.post("/checkout", auth, async (req, res) => {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.json({ url: null, error: "Stripe not configured" });
    }

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
            unit_amount: 1900,
            recurring: { interval: "month" },
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/subscription?success=true`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/subscription?cancel=true`,
      client_reference_id: req.user.business_id,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Checkout failed" });
  }
});

// Stripe webhook
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("❌ Signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      await db.query("BEGIN");

      const existing = await db.query(
        "SELECT id FROM stripe_events WHERE event_id=$1",
        [event.id]
      );

      if (existing.rows.length > 0) {
        await db.query("ROLLBACK");
        return res.json({ received: true });
      }

      await db.query(
        "INSERT INTO stripe_events(event_id) VALUES($1)",
        [event.id]
      );

      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object;
          const businessId = session.client_reference_id;

          if (businessId) {
            await db.query(
              "UPDATE businesses SET subscription_active=true WHERE id=$1",
              [businessId]
            );
            console.log("✅ Subscription activated:", businessId);
          }
          break;
        }

        case "invoice.payment_failed": {
          const customerId = event.data.object.customer;
          await db.query(
            "UPDATE businesses SET subscription_active=false WHERE stripe_customer_id=$1",
            [customerId]
          );
          console.log("⚠️ Subscription payment failed:", customerId);
          break;
        }

        case "customer.subscription.deleted": {
          const customerId = event.data.object.customer;
          await db.query(
            "UPDATE businesses SET subscription_active=false WHERE stripe_customer_id=$1",
            [customerId]
          );
          console.log("❌ Subscription cancelled:", customerId);
          break;
        }

        case "invoice.payment_succeeded": {
          const customerId = event.data.object.customer;
          const nextBilling = new Date(event.data.object.period_end * 1000);
          await db.query(
            "UPDATE businesses SET subscription_active=true WHERE stripe_customer_id=$1",
            [customerId]
          );
          console.log("💰 Payment succeeded:", customerId);
          break;
        }

        default:
          console.log("Unhandled event:", event.type);
      }

      await db.query("COMMIT");
      res.json({ received: true });

    } catch (err) {
      await db.query("ROLLBACK");
      console.error("Webhook processing error:", err);
      res.status(500).send("Server error");
    }
  }
);

module.exports = router;
