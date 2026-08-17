-- Create playbooks table
CREATE TABLE public.playbooks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  rules JSONB DEFAULT '[]'::jsonb,
  strategy_type TEXT DEFAULT 'general',
  tags TEXT[] DEFAULT ARRAY[]::text[],
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Enable RLS
ALTER TABLE public.playbooks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "playbooks_select_own" ON public.playbooks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "playbooks_insert_own" ON public.playbooks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "playbooks_update_own" ON public.playbooks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "playbooks_delete_own" ON public.playbooks
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_playbooks_user_id ON public.playbooks(user_id);
CREATE INDEX idx_playbooks_created_at ON public.playbooks(created_at DESC);
