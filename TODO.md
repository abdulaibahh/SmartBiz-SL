# SmartBiz-SL Implementation TODO

## Phase 1: Database & Backend Foundation

### 1.1 Database Updates
- [ ] Add `orders` table for supplier orders
- [ ] Add `order_items` table for order line items
- [ ] Add `supplier_payments` table for payments to suppliers
- [ ] Add `password_reset_tokens` table for password reset
- [ ] Update `sales` table with `sale_type` column (cash/credit)
- [ ] Update `users` table with `password_reset_token` and expiry fields

### 1.2 Password Reset Feature
- [ ] Backend: Add password reset request endpoint
- [ ] Backend: Add password reset confirm endpoint
- [ ] Frontend: Add password reset request page
- [ ] Frontend: Add password reset confirm page
- [ ] Update login page with "Forgot Password" link

### 1.3 Debt Management Enhancement
- [ ] Backend: Add debt payment endpoint
- [ ] Backend: Get customer debt endpoint
- [ ] Backend: Update debt after payment
- [ ] Frontend: Add debt payment modal
- [ ] Frontend: Show customer debt on customer detail

### 1.4 Orders from Suppliers
- [ ] Backend: Create order endpoint
- [ ] Backend: Get orders endpoint
- [ ] Backend: Receive order (auto-increase stock)
- [ ] Backend: Update order status
- [ ] Frontend: Orders list page
- [ ] Frontend: Create order form
- [ ] Frontend: Receive order functionality

### 1.5 Payments to Suppliers
- [ ] Backend: Create supplier payment endpoint
- [ ] Backend: Get supplier payments endpoint
- [ ] Frontend: Supplier payments section in orders

## Phase 2: Frontend Features

### 2.1 Quick Sale Enhancement
- [ ] Add "Quick Sale" button to dashboard
- [ ] Add "Add New Customer" button in sales page
- [ ] Add customer registration modal
- [ ] Add Cash/Credit sale type toggle

### 2.2 Role-Based Access Control
- [ ] Update role middleware for cashier limitations
- [ ] Hide admin-only features from cashiers
- [ ] Add permission checks on routes
- [ ] Add visual indicators for restricted features

### 2.3 Subscription Enhancement
- [ ] Add payment verification status display
- [ ] Add bank transfer option display
- [ ] Add payment confirmation instructions

## Phase 3: AI Enhancements

### 3.1 Enhanced AI Features
- [ ] Add more detailed sales insights
- [ ] Add inventory forecasting
- [ ] Add customer behavior insights
- [ ] Improve natural language queries

## Phase 4: Polish & Testing

### 4.1 UI/UX Improvements
- [ ] Add loading states
- [ ] Add error handling
- [ ] Add empty states
- [ ] Improve mobile responsiveness

### 4.2 Currency Display
- [ ] Verify NLE currency format
- [ ] Update all currency displays

## Implementation Order:
1. Update database schema
2. Implement password reset
3. Implement debt management
4. Implement orders & supplier payments
5. Update frontend features
6. Test and polish
