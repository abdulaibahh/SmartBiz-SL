-- =============================================
-- DEBT SCHEMA FIX
-- Run this to fix debt-related tables and columns
-- =============================================

-- Add missing columns to debts table
ALTER TABLE debts ADD COLUMN IF NOT EXISTS customer_id INTEGER REFERENCES customers(id);
ALTER TABLE debts ADD COLUMN IF NOT EXISTS sale_id INTEGER REFERENCES sales(id);
ALTER TABLE debts ADD COLUMN IF NOT EXISTS payment_amount NUMERIC DEFAULT 0;
ALTER TABLE debts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE debts ADD COLUMN IF NOT EXISTS due_date DATE;
ALTER TABLE debts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Add customer_id to customers table if not exists
ALTER TABLE customers ADD COLUMN IF NOT EXISTS total_debt NUMERIC DEFAULT 0;

-- Create debt_payments table if not exists
CREATE TABLE IF NOT EXISTS debt_payments (
  id SERIAL PRIMARY KEY,
  debt_id INTEGER REFERENCES debts(id) ON DELETE CASCADE,
  business_id INTEGER REFERENCES businesses(id),
  amount NUMERIC NOT NULL,
  notes TEXT,
  payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Verify the tables
SELECT 'Debts table columns:' as info;
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'debts';

SELECT 'Debt_payments table columns:' as info;
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'debt_payments';

SELECT 'Customers table columns:' as info;
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'total_debt';

SELECT 'Debt schema fix completed!' as status;
