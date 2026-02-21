const router = require("express").Router();
const { Pool } = require("pg");

// Health check with database test - creates its own connection
router.get("/health2", async (req, res) => {
  let pool;
  try {
    console.log("Testing database connection with direct pool...");
    console.log("DATABASE_URL:", process.env.DATABASE_URL ? "SET" : "NOT SET");
    
    // Create a new pool directly in the route
    pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
    
    // Test database connection
    const result = await pool.query("SELECT NOW()");
    
    // Check if tables exist
    const tables = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    const tableNames = tables.rows.map(t => t.table_name);
    
    await pool.end();
    
    res.json({
      status: "ok",
      time: result.rows[0].now,
      tables: tableNames
    });
  } catch (err) {
    console.error("Database health check error:", err);
    if (pool) await pool.end();
    res.status(500).json({
      status: "error",
      message: err.message,
      code: err.code,
      hint: "Check if DATABASE_URL environment variable is set correctly"
    });
  }
});

module.exports = router;
