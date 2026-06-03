-- Create table to store IDE Workspaces
CREATE TABLE IF NOT EXISTS public.workspaces (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'My Workspace',
  files JSONB NOT NULL DEFAULT '[]'::jsonb,
  chat_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  terminal_logs JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can only view their own workspaces" 
  ON public.workspaces FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own workspaces" 
  ON public.workspaces FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workspaces" 
  ON public.workspaces FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workspaces" 
  ON public.workspaces FOR DELETE 
  USING (auth.uid() = user_id);
