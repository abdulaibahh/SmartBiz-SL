# Delete Account Fix - TODO

## Task
Fix the "delete account fails sometimes" issue

## Root Cause
The delete account endpoint references a non-existent `order_payments` table and is missing deletion of several other related tables.

## Plan
- [ ] Fix `backend/src/routes/auth.routes.js` - Update delete account endpoint
- [ ] Fix `backend/src/routes/business.routes.js` - Update delete account endpoint

## Changes Needed
1. Remove reference to non-existent `order_payments` table
2. Add proper deletion of `sales_items` before `sales`
3. Add deletion of `subscriptions` table
4. Add deletion of `password_reset_tokens` table
5. Add deletion of `stripe_events` table  
6. Add deletion of `supplier_payments` table
7. Fix the deletion order to respect foreign key constraints

## Status: IN PROGRESS
