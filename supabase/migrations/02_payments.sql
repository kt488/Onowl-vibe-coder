-- Create payments table to store manual UPI submissions
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL,
  amount DECIMAL NOT NULL,
  utr TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected
  screenshot_url TEXT,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own payments" 
  ON public.payments FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payments" 
  ON public.payments FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all payments" 
  ON public.payments FOR SELECT 
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE plan = 'admin'));

CREATE POLICY "Admins can update payments" 
  ON public.payments FOR UPDATE 
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE plan = 'admin'));
