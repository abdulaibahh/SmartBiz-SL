# SmartBiz-SL Implementation Plan

## Project Overview
**SmartBiz-SL** - A comprehensive business tracking system for SMEs in Sierra Leone
- **Type**: Full-stack Web Application (Commercial Product)
- **Tech Stack**: FastAPI + PostgreSQL + React + Tailwind CSS
- **Currency**: New Leones (NLE)
- **Target Users**: Small shops, wholesale businesses, service businesses

---

## Phase 1: Project Setup & Core Infrastructure

### 1.1 Directory Structure
```
SmartBiz-SL/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI application entry
│   │   ├── config.py            # Configuration settings
│   │   ├── database.py          # PostgreSQL connection
│   │   ├── models.py            # SQLAlchemy models
│   │   ├── schemas.py           # Pydantic schemas
│   │   ├── auth.py              # JWT authentication
│   │   ├── routers/             # API endpoints
│   │   │   ├── __init__.py
│   │   │   ├── auth.py          # Login, signup, password reset
│   │   │   ├── users.py         # User management
│   │   │   ├── business.py      # Business settings
│   │   │   ├── products.py      # Stock/Product management
│   │   │   ├── customers.py     # Customer management
│   │   │   ├── sales.py         # Sales transactions
│   │   │   ├── debt.py          # Debt tracking
│   │   │   ├── orders.py        # Orders from other businesses
│   │   │   ├── ai.py            # AI features
│   │   │   └── subscription.py  # Subscription management
│   │   ├── services/
│   │   │   ├── pdf_service.py   # PDF receipt generation
│   │   │   ├── email_service.py # Email sending
│   │   │   └── ai_service.py    # AI integration
│   │   └── utils/
│   │       └── helpers.py
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/          # Reusable components
│   │   ├── pages/               # Page components
│   │   ├── services/             # API services
│   │   ├── hooks/               # Custom hooks
│   │   ├── context/             # React context
│   │   └── utils/
│   ├── package.json
│   └── tailwind.config.js
└── README.md
```

### 1.2 Database Schema (PostgreSQL)

#### Users Table
```
sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) DEFAULT 'cashier', -- 'owner', 'cashier'
    business_id UUID REFERENCES businesses(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Businesses Table
```
sql
CREATE TABLE businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    business_name VARCHAR(255) NOT NULL,
    business_type VARCHAR(50), -- 'retail', 'wholesale', 'service'
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    logo_url TEXT,
    tax_number VARCHAR(50),
    currency VARCHAR(10) DEFAULT 'NLE',
    subscription_status VARCHAR(20) DEFAULT 'trial', -- 'trial', 'active', 'expired'
    trial_start_date DATE,
    trial_end_date DATE,
    subscription_start_date DATE,
    subscription_end_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Products/Stock Table
```
sql
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(50) UNIQUE,
    category VARCHAR(100),
    description TEXT,
    input_cost DECIMAL(12,2) NOT NULL, -- Cost price
    selling_price DECIMAL(12,2) NOT NULL,
    quantity INTEGER DEFAULT 0,
    reorder_level INTEGER DEFAULT 10,
    unit VARCHAR(50), -- 'pcs', 'kg', 'liters', etc.
    barcode VARCHAR(100),
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Customers Table
```
sql
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    total_debt DECIMAL(12,2) DEFAULT 0,
    credit_limit DECIMAL(12,2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Sales Table
```
sql
CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id),
    user_id UUID REFERENCES users(id),
    sale_type VARCHAR(20) DEFAULT 'cash', -- 'cash', 'credit'
    subtotal DECIMAL(12,2) NOT NULL,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL,
    amount_paid DECIMAL(12,2) DEFAULT 0,
    change_given DECIMAL(12,2) DEFAULT 0,
    amount_due DECIMAL(12,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'completed', -- 'pending', 'completed', 'cancelled'
    receipt_pdf_url TEXT,
    receipt_sent BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Sale Items Table
```
sql
CREATE TABLE sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    total_price DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Debt Transactions Table
```
sql
CREATE TABLE debt_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id),
    sale_id UUID REFERENCES sales(id),
    amount DECIMAL(12,2) NOT NULL,
    payment_amount DECIMAL(12,2) DEFAULT 0,
    balance DECIMAL(12,2) NOT NULL,
    transaction_type VARCHAR(20) NOT NULL, -- 'sale', 'payment', 'adjustment'
    notes TEXT,
    due_date DATE,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'partial', 'paid'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Orders (from other businesses) Table
```
sql
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    supplier_name VARCHAR(255) NOT NULL,
    supplier_contact VARCHAR(255),
    order_date DATE NOT NULL,
    expected_delivery_date DATE,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'received', 'cancelled'
    total_amount DECIMAL(12,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Order Items Table
```
sql
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    product_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    total_price DECIMAL(12,2) NOT NULL,
    received_quantity INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Payments to Suppliers Table
```
sql
CREATE TABLE supplier_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id),
    amount DECIMAL(12,2) NOT NULL,
    payment_method VARCHAR(50), -- 'cash', 'orange_money', 'bank_transfer'
    reference_number VARCHAR(100),
    payment_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Phase 2: Backend Implementation

### 2.1 Core Modules

#### Authentication (JWT)
- User signup with email verification
- Login with email/password
- Password reset via email
- JWT token generation and validation
- Role-based access control (Owner, Cashier)

#### User Management
- Create users (Business Owner only)
- Update user details
- Deactivate/activate users
- View all users in a business

#### Business Settings
- Add/edit business details
- Upload business logo
- Configure shop name (for PDF receipts)
- Business type selection

#### Product/Stock Management
- Add products with input cost and selling price
- Update product details
- Track quantity
- Low stock alerts
- Barcode support
- Category management

#### Customer Management
- Add customers
- View customer debt
- Credit limit设置
- Customer transaction history

#### Sales Module
- Quick sale form
- Select products from stock
- Calculate total price
- Handle cash and credit sales
- Generate PDF receipts
- Auto-send receipts via email

#### Debt Tracking
- Track customer debt
- Record payments
- Debt history
- Outstanding balance alerts

#### Orders Management
- Create orders from suppliers
- Receive ordered items (auto-update stock)
- Track payments to suppliers

#### AI Features
- AI Business Summary
- Natural language queries
- Sales & Inventory Insights

#### Subscription Management
- Trial period tracking (1 month)
- Subscription status management
- Payment information display

---

## Phase 3: Frontend Implementation

### 3.1 Pages

#### Public Pages
- Landing Page
- Login Page
- Signup Page
- Password Reset Page

#### Dashboard (Owner & Cashier)
- Quick Stats (Today's sales, Total customers, Low stock items)
- Quick Sale Button
- Recent Transactions
- AI Summary Widget

#### User Management (Owner only)
- User List
- Add User Form
- Edit User

#### Business Settings (Owner only)
- Business Details Form
- Logo Upload
- Shop Name Configuration

#### Products/Stock (Owner & Cashier)
- Product List
- Add Product Form
- Edit Product
- Stock Alerts
- Category Management

#### Customers (Owner & Cashier)
- Customer List
- Add Customer Form
- Customer Details (including debt)
- Quick Register Customer (from Quick Sale)

#### Quick Sale (Owner & Cashier)
- Product Selection (search/select from stock)
- Quantity input
- Customer selection (optional)
- Sale type toggle (cash/credit)
- Total calculation
- Checkout button
- "Add New Customer" button

#### Sales History (Owner & Cashier)
- Sales List
- Filter by date, customer, type
- View receipt
- Resend receipt

#### Debt Management (Owner & Cashier)
- Outstanding Debts List
- Record Payment
- Debt History

#### Orders (Owner only)
- Order List
- Create Order
- Receive Order
- Supplier Payments

#### AI Features (Owner only)
- AI Summary Dashboard
- Ask Your Business (chat interface)
- Insights Panel

#### Subscription (Owner only)
- Current Plan Status
- Upgrade to Paid
- Payment Instructions (Orange Money, Bank Transfer)
- Contact for payment confirmation

---

## Phase 4: AI Implementation

### 4.1 AI Business Summary
- Weekly/Monthly sales summary
- Revenue trends
- Best selling products
- Underperforming products
- Written in plain English

### 4.2 Ask Your Business
- Natural language query input
- Convert question to SQL
- Execute query
- Return explanation (not just data)

### 4.3 Sales & Inventory Insights
- Products likely to run out
- Slow-moving products
- Best performing days
- Customer behavior insights

---

## Phase 5: Monetization

### 5.1 Trial System
- 30-day free trial
- Automatic expiry detection
- Graceful access restriction after trial

### 5.2 Subscription Display
- Display payment instructions:
  - Orange Money: +23275756395
  - Bank Account: 540120520391143
- Manual verification process

---

## Implementation Steps

### Step 1: Project Initialization
- [ ] Set up FastAPI backend
- [ ] Set up React frontend
- [ ] Configure PostgreSQL database
- [ ] Set up environment variables

### Step 2: Database & Models
- [ ] Create database schema
- [ ] Define SQLAlchemy models
- [ ] Create Pydantic schemas

### Step 3: Authentication
- [ ] Implement JWT auth
- [ ] Create signup/login endpoints
- [ ] Implement password reset
- [ ] Add role-based access

### Step 4: Core Business Features
- [ ] User management
- [ ] Business settings
- [ ] Product/stock management
- [ ] Customer management

### Step 5: Sales Module
- [ ] Quick sale form
- [ ] Product selection
- [ ] Total calculation
- [ ] PDF receipt generation
- [ ] Email receipt sending

### Step 6: Debt & Orders
- [ ] Debt tracking
- [ ] Payment recording
- [ ] Order management
- [ ] Supplier payments

### Step 7: Subscription
- [ ] Trial period logic
- [ ] Subscription status
- [ ] Payment display page

### Step 8: AI Features
- [ ] AI summary endpoint
- [ ] Natural language query
- [ ] Insights generation

### Step 9: Frontend Polish
- [ ] UI/UX improvements
- [ ] Responsive design
- [ ] Loading states
- [ ] Error handling

### Step 10: Testing & Deployment
- [ ] Unit tests
- [ ] Integration tests
- [ ] Deployment setup

---

## API Endpoints Summary

### Auth
- POST /api/auth/signup
- POST /api/auth/login
- POST /api/auth/password-reset
- POST /api/auth/reset-password/{token}

### Users
- GET /api/users
- POST /api/users (Owner only)
- GET /api/users/{id}
- PUT /api/users/{id}
- DELETE /api/users/{id}

### Business
- GET /api/business
- PUT /api/business
- POST /api/business/logo

### Products
- GET /api/products
- POST /api/products
- GET /api/products/{id}
- PUT /api/products/{id}
- DELETE /api/products/{id}
- GET /api/products/low-stock

### Customers
- GET /api/customers
- POST /api/customers
- GET /api/customers/{id}
- PUT /api/customers/{id}
- DELETE /api/customers/{id}

### Sales
- GET /api/sales
- POST /api/sales
- GET /api/sales/{id}
- GET /api/sales/{id}/receipt
- POST /api/sales/{id}/send-receipt

### Debt
- GET /api/debts
- POST /api/debts/payment
- GET /api/debts/customer/{id}

### Orders
- GET /api/orders
- POST /api/orders
- PUT /api/orders/{id}/receive
- POST /api/orders/{id}/payment

### AI
- GET /api/ai/summary
- POST /api/ai/query
- GET /api/ai/insights

### Subscription
- GET /api/subscription/status
- POST /api/subscription/activate

---

## Next Steps

1. Confirm this implementation plan
2. Start with Phase 1: Project Setup
3. Create backend structure and dependencies
4. Set up database schema
5. Implement authentication
6. Build core features step by step