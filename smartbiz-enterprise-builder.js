const fs = require("fs");
const path = require("path");

function write(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

console.log("🚀 Building SmartBiz Enterprise Backend (PostgreSQL)");

/* ================= PACKAGE ================= */

write("backend/package.json", JSON.stringify({
  name: "smartbiz-backend",
  version: "2.0.0",
  main: "server.js",
  scripts: {
    dev: "nodemon server.js",
    start: "node server.js"
  }
}, null, 2));

/* ================= SERVER ================= */

write("backend/server.js", `
require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", require("./src/routes/auth.routes"));
app.use("/api/sales", require("./src/routes/sales.routes"));
app.use("/api/inventory", require("./src/routes/inventory.routes"));
app.use("/api/debt", require("./src/routes/debt.routes"));
app.use("/api/subscription", require("./src/routes/subscription.routes"));
app.use("/api/ai", require("./src/routes/ai.routes"));

app.listen(5000, () => console.log("✅ Enterprise Server running on 5000"));
`);

/* ================= DB ================= */

write("backend/src/config/db.js", `
const { Pool } = require("pg");
module.exports = new Pool({
  connectionString: process.env.DATABASE_URL
});
`);

/* ================= AUTH ================= */

write("backend/src/middlewares/auth.js", `
const jwt = require("jsonwebtoken");

module.exports = (req,res,next)=>{
  const token = req.headers.authorization?.split(" ")[1];
  if(!token) return res.status(401).json({message:"No token"});
  try{
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  }catch{
    res.status(403).json({message:"Invalid token"});
  }
};
`);

/* ================= SUBSCRIPTION ENFORCEMENT ================= */

write("backend/src/middlewares/subscription.js", `
const db = require("../config/db");

module.exports = async(req,res,next)=>{
  const result = await db.query(
    "SELECT trial_end, subscription_active FROM businesses WHERE id=$1",
    [req.user.business_id]
  );

  const biz = result.rows[0];
  const now = new Date();

  if(biz.subscription_active) return next();
  if(new Date(biz.trial_end) > now) return next();

  return res.status(402).json({message:"Subscription expired"});
};
`);

/* ================= SALES + DEBT ================= */

write("backend/src/routes/sales.routes.js", `
const router = require("express").Router();
const db = require("../config/db");
const auth = require("../middlewares/auth");
const sub = require("../middlewares/subscription");
const PDFDocument = require("pdfkit");
const nodemailer = require("nodemailer");

router.post("/quick", auth, sub, async(req,res)=>{
  const {total,paid,customer,email} = req.body;
  const debt = total - paid;

  await db.query(
    "INSERT INTO sales(business_id,total,paid,customer) VALUES($1,$2,$3,$4)",
    [req.user.business_id,total,paid,customer]
  );

  if(debt > 0){
    await db.query(
      "INSERT INTO debts(business_id,customer,amount) VALUES($1,$2,$3)",
      [req.user.business_id,customer,debt]
    );
  }

  const doc = new PDFDocument();
  const file = \`receipt-\${Date.now()}.pdf\`;
  doc.pipe(require("fs").createWriteStream(file));
  doc.text("SmartBiz Receipt");
  doc.text("Customer: "+customer);
  doc.text("Total: "+total);
  doc.text("Paid: "+paid);
  doc.text("Debt: "+debt);
  doc.end();

  if(email){
    const transporter = nodemailer.createTransport({
      service:"gmail",
      auth:{user:process.env.EMAIL_USER,pass:process.env.EMAIL_PASS}
    });

    await transporter.sendMail({
      from:process.env.EMAIL_USER,
      to:email,
      subject:"Your Receipt",
      text:"Attached is your receipt",
      attachments:[{filename:file,path:file}]
    });
  }

  res.json({message:"Sale completed"});
});

module.exports = router;
`);

/* ================= INVENTORY ================= */

write("backend/src/routes/inventory.routes.js", `
const router = require("express").Router();
const db = require("../config/db");
const auth = require("../middlewares/auth");
const sub = require("../middlewares/subscription");

router.post("/supplier-order", auth, sub, async(req,res)=>{
  const {product,quantity} = req.body;

  const existing = await db.query(
    "SELECT * FROM inventory WHERE business_id=$1 AND product=$2",
    [req.user.business_id,product]
  );

  if(existing.rows.length){
    await db.query(
      "UPDATE inventory SET quantity=quantity+$1 WHERE business_id=$2 AND product=$3",
      [quantity,req.user.business_id,product]
    );
  }else{
    await db.query(
      "INSERT INTO inventory(business_id,product,quantity) VALUES($1,$2,$3)",
      [req.user.business_id,product,quantity]
    );
  }

  res.json({message:"Inventory updated"});
});

module.exports = router;
`);

/* ================= DEBT ================= */

write("backend/src/routes/debt.routes.js", `
const router = require("express").Router();
const db = require("../config/db");
const auth = require("../middlewares/auth");

router.get("/all", auth, async(req,res)=>{
  const debts = await db.query(
    "SELECT * FROM debts WHERE business_id=$1",
    [req.user.business_id]
  );
  res.json(debts.rows);
});

module.exports = router;
`);

/* ================= SUBSCRIPTION ================= */

write("backend/src/routes/subscription.routes.js", `
const router = require("express").Router();
const db = require("../config/db");
const auth = require("../middlewares/auth");

router.post("/activate", auth, async(req,res)=>{
  await db.query(
    "UPDATE businesses SET subscription_active=true WHERE id=$1",
    [req.user.business_id]
  );
  res.json({message:"Subscription activated"});
});

module.exports = router;
`);

/* ================= AI BUSINESS INSIGHTS ================= */

write("backend/src/routes/ai.routes.js", `
const router = require("express").Router();
const db = require("../config/db");
const auth = require("../middlewares/auth");

router.get("/ask", auth, async(req,res)=>{
  const {question} = req.query;

  const revenue = await db.query(
    "SELECT SUM(total) as revenue FROM sales WHERE business_id=$1",
    [req.user.business_id]
  );

  res.json({
    answer: "Based on your data, total revenue is NLE " +
      (revenue.rows[0].revenue || 0) +
      ". AI insight for question: " + question
  });
});

module.exports = router;
`);

console.log("✅ Enterprise Backend Generated Successfully");
