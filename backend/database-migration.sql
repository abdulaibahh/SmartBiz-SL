-- =============================================
-- RETAIL & WHOLESALE STOCK MIGRATION SCRIPT
-- =============================================
-- Run this script directly in your PostgreSQL database
-- Options:
-- 1. pgAdmin: Open query tool and run this script
-- 2. psql: psql -U postgres -d smartbiz -f database-migration.sql
-- 3. Online PostgreSQL viewer (if available)
-- =============================================

-- Add retail and wholesale columns to inventory table
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS retail_quantity INTEGER DEFAULT 0;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS wholesale_quantity INTEGER DEFAULT 0;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS retail_price NUMERIC DEFAULT 0;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS wholesale_price NUMERIC DEFAULT 0;

-- Add sale_type and transaction_type columns to sales table
ALTER TABLE sales ADD COLUMN IF NOT EXISTS sale_type TEXT DEFAULT 'retail';
ALTER TABLE sales ADD COLUMN IF NOT EXISTS transaction_type TEXT DEFAULT 'cash';

-- Verify the changes
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'inventory' 
AND column_name IN ('retail_quantity', 'wholesale_quantity', 'retail_price', 'wholesale_price');

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'sales' 
AND column_name IN ('sale_type', 'transaction_type');

-- Optional: Copy existing quantity and selling_price to retail columns for existing data
UPDATE inventory 
SET retail_quantity = COALESCE(quantity, 0),
    retail_price = COALESCE(selling_price, 0)
WHERE retail_quantity = 0 OR retail_quantity IS NULL;

-- Optional: Set default sale_type for existing sales
UPDATE sales SET sale_type = 'retail' WHERE sale_type IS NULL OR sale_type = '';

-- Done!
SELECT 'Migration completed successfully!' as status;
