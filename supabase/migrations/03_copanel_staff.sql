-- Migration for Staff Co-Panel Dashboard

-- Add notes and payment_method columns
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'UPI';

-- Update RLS policies to include 'staff'
DROP POLICY IF EXISTS "Admins can view all payments" ON public.payments;
CREATE POLICY "Admins and Staff can view all payments" 
  ON public.payments FOR SELECT 
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE plan IN ('admin', 'staff')));

DROP POLICY IF EXISTS "Admins can update payments" ON public.payments;
CREATE POLICY "Admins and Staff can update payments" 
  ON public.payments FOR UPDATE 
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE plan IN ('admin', 'staff')));
