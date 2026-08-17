-- Create the rules table for user trading rules
CREATE TABLE public.rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.rules ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own rules"
ON public.rules FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can create rules"
ON public.rules FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own rules"
ON public.rules FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own rules"
ON public.rules FOR DELETE
USING (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX idx_rules_user_id ON public.rules(user_id);
CREATE INDEX idx_rules_is_active ON public.rules(is_active);
CREATE INDEX idx_rules_category ON public.rules(category);
