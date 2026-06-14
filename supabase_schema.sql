-- SUPABASE SQL BLUEPRINT SETUP FOR PERSONAL DEVELOPER DASHBOARD
-- copy and paste this complete schema directly into your Supabase SQL Editor on your mobile phone!

-- -------------------------------------------------------------
-- 1. Create table for Developer Projects (Project Vault)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.developer_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_name TEXT NOT NULL,
    platform_used TEXT NOT NULL,
    associated_email TEXT NOT NULL,
    project_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Enable RLS (Row Level Security) for compliance
ALTER TABLE public.developer_projects ENABLE ROW LEVEL SECURITY;

-- Create dynamic public allow-all policies for starting developer ease
CREATE POLICY "Allow anonymous read check" 
    ON public.developer_projects FOR SELECT USING (true);

CREATE POLICY "Allow anonymous insert check" 
    ON public.developer_projects FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous delete check" 
    ON public.developer_projects FOR DELETE USING (true);


-- -------------------------------------------------------------
-- 2. Create table for Developer Credentials (Secrets Keyring)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.developer_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_name TEXT NOT NULL,
    ip_address TEXT DEFAULT '127.0.0.1' NOT NULL,
    api_token TEXT,       -- AES encrypted token
    secret_key TEXT,      -- AES encrypted secret
    service_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Enable RLS
ALTER TABLE public.developer_credentials ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow anonymous read credentials" 
    ON public.developer_credentials FOR SELECT USING (true);

CREATE POLICY "Allow anonymous insert credentials" 
    ON public.developer_credentials FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous delete credentials" 
    ON public.developer_credentials FOR DELETE USING (true);


-- -------------------------------------------------------------
-- 3. Create table for Smart Prompt History (Token Optimization Logs)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.prompt_history (
    id TEXT PRIMARY KEY, -- standard unique format ids
    arabic_prompt TEXT NOT NULL,
    english_prompt TEXT NOT NULL,
    arabic_tokens INTEGER DEFAULT 0 NOT NULL,
    english_tokens INTEGER DEFAULT 0 NOT NULL,
    tokens_saved INTEGER DEFAULT 0 NOT NULL,
    percent_saved INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Enable RLS
ALTER TABLE public.prompt_history ENABLE ROW LEVEL SECURITY;

-- Create policies for full cross-device replication
CREATE POLICY "Allow anonymous read prompt logs" 
    ON public.prompt_history FOR SELECT USING (true);

CREATE POLICY "Allow anonymous insert prompt logs" 
    ON public.prompt_history FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous delete prompt logs" 
    ON public.prompt_history FOR DELETE USING (true);
