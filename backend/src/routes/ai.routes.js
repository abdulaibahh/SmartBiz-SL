const router = require("express").Router();
const db = require("../config/db");
const auth = require("../middlewares/auth");

// Lazy load OpenAI to avoid startup errors
let openai = null;
const getOpenAI = () => {
  if (!openai && process.env.OPENAI_KEY) {
    const OpenAI = require("openai");
    openai = new OpenAI({ apiKey: process.env.OPENAI_KEY });
  }
  return openai;
};

/* ================= ASK AI ================= */

router.get("/ask", auth, async (req, res) => {
  try {
    const { question } = req.query;

    if (!question) {
      return res.status(400).json({ answer: "Please ask a question" });
    }

    // Get business revenue
    const sales = await db.query(
      "SELECT COALESCE(SUM(total), 0) as revenue FROM sales WHERE business_id=$1",
      [req.user.business_id]
    );

    const revenue = sales.rows[0].revenue || 0;

    // Check if OpenAI is configured
    const openaiInstance = getOpenAI();
    
    if (!openaiInstance) {
      // Return mock response if no OpenAI key
      return res.json({
        answer: `Based on your business data:\n\n💰 Total Revenue: $${revenue}\n\n📊 Business Tips:\n1. Track daily sales to identify peak periods\n2. Follow up on outstanding debts regularly\n3. Keep inventory levels optimized\n4. Consider offering discounts for bulk purchases\n\nNote: Configure OPENAI_KEY in backend .env for AI-powered insights.`
      });
    }

    const prompt = `
Business revenue: $${revenue}
User question: ${question}
Give smart, concise business advice. Focus on actionable insights.
`;

    const completion = await openaiInstance.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500
    });

    res.json({ answer: completion.choices[0].message.content });
  } catch (err) {
    console.error("AI ask error:", err);
    res.json({ 
      answer: "Sorry, I encountered an error. Please try again later." 
    });
  }
});

module.exports = router;
