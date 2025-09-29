/*
  # Banking Panel Schema

  1. New Tables
    - `users` - Admin users with email/password authentication
    - `bank_accounts` - Stores account configurations (transactional, fee, receiving)
    - `account_balances` - Cache for account balances with timestamps
    - `pix_out_requests` - PIX OUT transactions with tracking
    - `audit_logs` - Security audit trail for all critical operations
    
  2. Security
    - Enable RLS on all tables
    - Policies for authenticated users only
    - Audit logging for all sensitive operations
    
  3. Features
    - Automatic timestamping
    - UUID primary keys
    - Proper indexing for performance
    - JSON storage for API responses
*/

-- Users table for admin authentication
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  role text DEFAULT 'admin',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Bank accounts configuration
CREATE TABLE IF NOT EXISTS bank_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  type text NOT NULL CHECK (type IN ('transactional', 'fee', 'receiving')),
  bank text NOT NULL,
  branch text NOT NULL,
  account text NOT NULL,
  digit text NOT NULL,
  tax_number text,
  holder_name text NOT NULL,
  account_type text DEFAULT '0',
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Account balances cache
CREATE TABLE IF NOT EXISTS account_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_account_id uuid REFERENCES bank_accounts(id) ON DELETE CASCADE,
  balance decimal(15,2) DEFAULT 0,
  blocked_balance decimal(15,2) DEFAULT 0,
  raw_entry_json jsonb,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(bank_account_id)
);

-- PIX OUT requests tracking
CREATE TABLE IF NOT EXISTS pix_out_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_number text UNIQUE,
  identifier text UNIQUE NOT NULL,
  value decimal(15,2) NOT NULL,
  payment_date date NOT NULL,
  description text,
  from_account_id uuid REFERENCES bank_accounts(id),
  to_account_id uuid REFERENCES bank_accounts(id),
  to_name text,
  to_tax_number text,
  to_bank text,
  to_branch text,
  to_account text,
  to_account_digit text,
  status text DEFAULT 'pending',
  receipt_url text,
  raw_response_json jsonb,
  error_code text,
  error_description text,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Audit logs for security
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  action text NOT NULL,
  entity text NOT NULL,
  entity_id uuid,
  ip_address inet,
  user_agent text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE pix_out_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can read own data" ON users FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admin can manage bank accounts" ON bank_accounts FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin can view account balances" ON account_balances FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin can manage pix requests" ON pix_out_requests FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin can view audit logs" ON audit_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "System can insert audit logs" ON audit_logs FOR INSERT TO authenticated WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_bank_accounts_type ON bank_accounts(type);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_active ON bank_accounts(is_active);
CREATE INDEX IF NOT EXISTS idx_pix_out_document_number ON pix_out_requests(document_number);
CREATE INDEX IF NOT EXISTS idx_pix_out_identifier ON pix_out_requests(identifier);
CREATE INDEX IF NOT EXISTS idx_pix_out_created_by ON pix_out_requests(created_by);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action ON audit_logs(user_id, action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Updated timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_bank_accounts_updated_at 
  BEFORE UPDATE ON bank_accounts 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_pix_out_requests_updated_at 
  BEFORE UPDATE ON pix_out_requests 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();