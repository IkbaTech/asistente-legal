/*
  # Fix payments table structure

  1. Changes
    - Ensure payments table has all required columns
    - Add missing columns if they don't exist
    - Ensure proper data types and constraints

  2. Security
    - Maintain existing RLS policies
    - Ensure triggers are properly set up
*/

-- First, check if payments table exists and create it if it doesn't
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  paypal_order_id text UNIQUE NOT NULL,
  amount decimal(10,2) NOT NULL,
  currency text DEFAULT 'USD' NOT NULL,
  status text NOT NULL CHECK (status IN ('CREATED', 'APPROVED', 'COMPLETED', 'CANCELLED', 'FAILED')),
  plan_type text NOT NULL CHECK (plan_type IN ('basic', 'professional', 'advanced')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add missing columns if they don't exist
DO $$
BEGIN
  -- Check and add amount column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'amount'
  ) THEN
    ALTER TABLE payments ADD COLUMN amount decimal(10,2) NOT NULL DEFAULT 0;
  END IF;

  -- Check and add currency column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'currency'
  ) THEN
    ALTER TABLE payments ADD COLUMN currency text DEFAULT 'USD' NOT NULL;
  END IF;

  -- Check and add plan_type column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'plan_type'
  ) THEN
    ALTER TABLE payments ADD COLUMN plan_type text NOT NULL DEFAULT 'basic';
  END IF;

  -- Check and add updated_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE payments ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Ensure RLS is enabled
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create or replace policies
DROP POLICY IF EXISTS "Users can read own payments" ON payments;
CREATE POLICY "Users can read own payments"
  ON payments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own payments" ON payments;
CREATE POLICY "Users can create own payments"
  ON payments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own payments" ON payments;
CREATE POLICY "Users can update own payments"
  ON payments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Ensure handle_updated_at function exists
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS handle_updated_at ON payments;
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Verify the table structure
DO $$
BEGIN
  RAISE NOTICE 'Payments table structure verification:';
  RAISE NOTICE 'Columns: %', (
    SELECT string_agg(column_name || ' (' || data_type || ')', ', ')
    FROM information_schema.columns
    WHERE table_name = 'payments'
  );
END $$;