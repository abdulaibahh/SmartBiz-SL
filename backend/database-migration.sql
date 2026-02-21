-- =============================================
-- RETAIL & WHOLESALE STOCK MIGRATION SCRIPT
-- =============================================
-- Run this script in pgAdmin
-- Host: dpg-d6cl9pdm5p6s73erpj70-a.frankfurt-postgres.render.com
-- Port: 5432
-- Database: smartbiz_4da2
-- User: smartbiz_4da2_user
-- Password: wyih70vFtI4XQMcm4rKwiCIm1U98sNyR
-- =============================================

-- Add retail and wholesale columns to inventory table
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS retail_quantity INTEGER DEFAULT 0;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS wholesale_quantity INTEGER DEFAULT 0;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS retail_cost_price NUMERIC DEFAULT 0;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS wholesale_cost_price NUMERIC DEFAULT 0;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS retail_price NUMERIC DEFAULT 0;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS wholesale_price NUMERIC DEFAULT 0;

-- Add sale_type and transaction_type columns to sales table
ALTER TABLE sales ADD COLUMN IF NOT EXISTS sale_type TEXT DEFAULT 'retail';
ALTER TABLE sales ADD COLUMN IF NOT EXISTS transaction_type TEXT DEFAULT 'cash';

-- Copy existing quantity and selling_price to retail columns for existing data
UPDATE inventory 
SET retail_quantity = COALESCE(quantity, 0),
    retail_cost_price = COALESCE(cost_price, 0),
    retail_price = COALESCE(selling_price, 0)
WHERE retail_quantity = 0 OR retail_quantity IS NULL;

-- Set default sale_type for existing sales
UPDATE sales SET sale_type = 'retail' WHERE sale_type IS NULL OR sale_type = '';
