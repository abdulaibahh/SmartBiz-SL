// Database connection diagnostic script
require("dotenv").config();

console.log("=== Database Connection Diagnostic ===\n");

// Check if DATABASE_URL exists
if (!process.env.DATABASE_URL) {
  console.error("❌ ERROR: DATABASE_URL is not set in your .env file");
  console.log("\nPlease add this line to your backend/.env file:");
  console.log("DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/smartbiz");
  console.log("\nIf you don't have a password, use:");
  console.log("DATABASE_URL=postgresql://postgres@localhost:5432/smartbiz");
  process.exit(1);
}

console.log("✓ DATABASE_URL is set");
console.log("\nConnection string (masked):");
const maskedUrl = process.env.DATABASE_URL.replace(/\/\/[^:]+:[^@]+@/, "//***:***@");
console.log(maskedUrl);

// Parse the connection string to check for issues
const url = process.env.DATABASE_URL;
const match = url.match(/postgresql:\/\/([^:]+):([^@]*)@(.+)$/);

if (!match) {
  console.error("\n❌ ERROR: Invalid DATABASE_URL format");
  console.log("Expected format: postgresql://username:password@host:port/database");
  console.log("\nExamples:");
  console.log("  With password: postgresql://postgres:mypassword@localhost:5432/smartbiz");
  console.log("  No password:   postgresql://postgres@localhost:5432/smartbiz");
  process.exit(1);
}

const [, username, password, hostPortDb] = match;

console.log(`\nParsed connection details:`);
console.log(`  Username: ${username}`);
console.log(`  Password: ${password ? "✓ set" : "✗ empty"}`);
console.log(`  Host/Port/DB: ${hostPortDb}`);

if (!password) {
  console.warn("\n⚠️  WARNING: Password is empty");
  console.log("If your PostgreSQL doesn't require a password, that's fine.");
  console.log("Otherwise, please add your password to the DATABASE_URL.");
}

// Try to connect
console.log("\n--- Testing Connection ---");
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("\n❌ Connection failed:", err.message);
    
    if (err.message.includes("password authentication failed")) {
      console.log("\n💡 The password in DATABASE_URL is incorrect.");
    } else if (err.message.includes("database") && err.message.includes("does not exist")) {
      console.log("\n💡 The database doesn't exist. Create it with:");
      console.log("   createdb smartbiz");
    } else if (err.message.includes("connect ECONNREFUSED")) {
      console.log("\n💡 PostgreSQL server is not running. Start it with:");
      console.log("   pg_ctl start");
    }
    
    process.exit(1);
  } else {
    console.log("✓ Successfully connected to database!");
    console.log("  Server time:", res.rows[0].now);
    pool.end();
  }
});
