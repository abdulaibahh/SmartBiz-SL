CREATE TABLE businesses (
  id SERIAL PRIMARY KEY,
  name TEXT,
  trial_end TIMESTAMP,
  subscription_active BOOLEAN DEFAULT false
);

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE,
  password TEXT,
  role TEXT,
  business_id INTEGER REFERENCES businesses(id)
);

CREATE TABLE sales (
  id SERIAL PRIMARY KEY,
  business_id INTEGER REFERENCES businesses(id),
  total NUMERIC,
  paid NUMERIC,
  customer TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE subscriptions (
  id SERIAL PRIMARY KEY,
  business_id INTEGER REFERENCES businesses(id),
  active BOOLEAN DEFAULT true,
  end_date TIMESTAMP
);

CREATE TABLE debts (
  id SERIAL PRIMARY KEY,
  business_id INTEGER REFERENCES businesses(id),
  customer TEXT,
  amount NUMERIC,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE inventory (
  id SERIAL PRIMARY KEY,
  business_id INTEGER REFERENCES businesses(id),
  product TEXT,
  quantity INTEGER
);

CREATE TABLE platform_admins (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE,
  password TEXT
);

SELECT COUNT(*) FROM businesses WHERE subscription_active=true;

CREATE TABLE stripe_events (
  id SERIAL PRIMARY KEY,
  event_id TEXT UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);

