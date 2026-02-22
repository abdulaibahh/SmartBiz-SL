require("dotenv").config();
const db = require("./src/config/db");

async function fixCustomersDebt() {
  console.log("Fixing customers table - adding total_debt column...");
  
  try {
    // Test connection first
    const testResult = await db.query("SELECT NOW()");
    console.log("✓ Database connected");
    
    // Add total_debt column to customers table
    try {
      await db.query(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS total_debt NUMERIC DEFAULT 0`);
      console.log("✓ total_debt column added to customers table");
    } catch (e) {
      if (e.message.includes('already exists')) {
        console.log("✓ total_debt column already exists");
      } else {
        console.log("Error adding column:", e.message);
      }
    }
    
    // Verify customers table structure
    const result = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'customers' 
      ORDER BY ordinal_position
    `);
    
    console.log("\nCustomers table structure:");
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });
    
    console.log("\n✅ Customers table fix completed!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Fix failed:", err.message);
    process.exit(1);
  }
}

fixCustomersDebt();
