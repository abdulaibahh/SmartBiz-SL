
const router = require("express").Router();
const db = require("../config/db");
const auth = require("../middlewares/auth");
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY
});

router.get("/ask", auth, async(req,res)=>{
  const {question} = req.query;

  const sales = await db.query(
    "SELECT SUM(total) as revenue FROM sales WHERE business_id=$1",
    [req.user.business_id]
  );

  const prompt = `
Business revenue: ${sales.rows[0].revenue || 0}
User question: ${question}
Give smart business advice.
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{role:"user",content:prompt}]
  });

  res.json({answer:completion.choices[0].message.content});
});

module.exports = router;
