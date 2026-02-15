const fs = require("fs");
const path = require("path");

function write(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

console.log("🚀 Upgrading SmartBiz to FULL SaaS PRO Edition");

/* ================= ROLE MIDDLEWARE ================= */

write("backend/src/middlewares/role.js", `
module.exports = (...roles) => {
  return (req,res,next)=>{
    if(!roles.includes(req.user.role))
      return res.status(403).json({message:"Access denied"});
    next();
  };
};
`);

/* ================= UPDATE SALES ROUTE WITH ROLE ================= */

write("backend/src/routes/sales.routes.js", `
const router = require("express").Router();
const db = require("../config/db");
const auth = require("../middlewares/auth");
const sub = require("../middlewares/subscription");
const role = require("../middlewares/role");
const PDFDocument = require("pdfkit");

router.post("/quick",
  auth,
  sub,
  role("owner","manager","cashier"),
  async(req,res)=>{
    const {total,paid,customer} = req.body;
    const debt = total - paid;

    await db.query(
      "INSERT INTO sales(business_id,total,paid,customer) VALUES($1,$2,$3,$4)",
      [req.user.business_id,total,paid,customer]
    );

    if(debt>0){
      await db.query(
        "INSERT INTO debts(business_id,customer,amount) VALUES($1,$2,$3)",
        [req.user.business_id,customer,debt]
      );
    }

    res.json({message:"Sale recorded"});
});

router.get("/all",
  auth,
  role("owner","manager"),
  async(req,res)=>{
    const sales = await db.query(
      "SELECT * FROM sales WHERE business_id=$1",
      [req.user.business_id]
    );
    res.json(sales.rows);
});

module.exports = router;
`);

/* ================= STRIPE SUBSCRIPTION ================= */

write("backend/src/routes/subscription.routes.js", `
const router = require("express").Router();
const db = require("../config/db");
const auth = require("../middlewares/auth");
const stripe = require("stripe")(process.env.STRIPE_SECRET);

router.post("/create-checkout", auth, async(req,res)=>{
  const session = await stripe.checkout.sessions.create({
    payment_method_types:["card"],
    mode:"subscription",
    line_items:[{
      price:process.env.STRIPE_PRICE_ID,
      quantity:1
    }],
    success_url:"http://localhost:3000/dashboard?success=true",
    cancel_url:"http://localhost:3000/dashboard?canceled=true"
  });

  res.json({url:session.url});
});

router.post("/webhook", async(req,res)=>{
  const event = req.body;

  if(event.type==="checkout.session.completed"){
    const session = event.data.object;

    await db.query(
      "UPDATE businesses SET subscription_active=true WHERE id=$1",
      [session.client_reference_id]
    );
  }

  res.json({received:true});
});

module.exports = router;
`);

/* ================= REAL OPENAI AI ENGINE ================= */

write("backend/src/routes/ai.routes.js", `
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

  const prompt = \`
Business revenue: \${sales.rows[0].revenue || 0}
User question: \${question}
Give smart business advice.
\`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{role:"user",content:prompt}]
  });

  res.json({answer:completion.choices[0].message.content});
});

module.exports = router;
`);

/* ================= SIMPLE FRONTEND ================= */

write("frontend/index.html", `
<!DOCTYPE html>
<html>
<head>
  <title>SmartBiz Dashboard</title>
</head>
<body>
  <h1>SmartBiz Dashboard</h1>

  <button onclick="loadSales()">Load Sales</button>
  <button onclick="createCheckout()">Subscribe</button>

  <h3>AI Ask</h3>
  <input id="question"/>
  <button onclick="askAI()">Ask</button>

  <pre id="output"></pre>

<script>
const token = localStorage.getItem("token");

async function loadSales(){
  const res = await fetch("http://localhost:5000/api/sales/all",{
    headers:{Authorization:"Bearer "+token}
  });
  document.getElementById("output").innerText =
    JSON.stringify(await res.json(),null,2);
}

async function createCheckout(){
  const res = await fetch("http://localhost:5000/api/subscription/create-checkout",{
    method:"POST",
    headers:{
      "Content-Type":"application/json",
      Authorization:"Bearer "+token
    }
  });
  const data = await res.json();
  window.location = data.url;
}

async function askAI(){
  const q = document.getElementById("question").value;
  const res = await fetch("http://localhost:5000/api/ai/ask?question="+q,{
    headers:{Authorization:"Bearer "+token}
  });
  document.getElementById("output").innerText =
    (await res.json()).answer;
}
</script>

</body>
</html>
`);

console.log("✅ FULL PRO Upgrade Complete");
