const cron = require("node-cron");
const db = require("../config/db");
const OpenAI = require("openai");
const nodemailer = require("nodemailer");

const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY });

cron.schedule("0 8 * * *", async () => {
  console.log("📊 Running daily AI reports...");

  const businesses = await db.query(
    "SELECT id,email FROM businesses WHERE subscription_active=true"
  );

  for (let biz of businesses.rows) {
    const sales = await db.query(
      "SELECT SUM(total) as revenue FROM sales WHERE business_id=$1 AND DATE(created_at)=CURRENT_DATE-1",
      [biz.id]
    );

    const prompt = `
Yesterday revenue: ${sales.rows[0].revenue || 0}
Write a short smart business summary.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }]
    });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: biz.email,
      subject: "📈 SmartBiz Daily Report",
      text: completion.choices[0].message.content
    });
  }
});
