const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const db = require("../config/db");

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

      /* Idempotency */
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

      /* ===== EVENT HANDLING ===== */

      switch (event.type) {

        case "checkout.session.completed": {
          const session = event.data.object;
          const businessId = session.client_reference_id;

          if (!businessId) break;

          await db.query(
            `UPDATE subscriptions
             SET active=true
             WHERE business_id=$1`,
            [businessId]
          );

          console.log("✅ Subscription activated:", businessId);
          break;
        }

        case "invoice.payment_failed": {
          const customerId = event.data.object.customer;

          await db.query(
            `UPDATE subscriptions
             SET active=false
             WHERE stripe_customer_id=$1`,
            [customerId]
          );

          console.log("⚠️ Subscription payment failed:", customerId);
          break;
        }

        case "customer.subscription.deleted": {
          const customerId = event.data.object.customer;

          await db.query(
            `UPDATE subscriptions
             SET active=false
             WHERE stripe_customer_id=$1`,
            [customerId]
          );

          console.log("❌ Subscription cancelled:", customerId);
          break;
        }

        case "invoice.payment_succeeded": {
          const customerId = event.data.object.customer;
          const nextBilling = new Date(event.data.object.period_end * 1000);

          await db.query(
            `UPDATE subscriptions
             SET active=true, next_billing=$1
             WHERE stripe_customer_id=$2`,
            [nextBilling, customerId]
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
