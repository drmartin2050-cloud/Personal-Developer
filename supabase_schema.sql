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


-- -------------------------------------------------------------
-- 4. Create table for Vault Credentials (Secrets Vault v2)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vault_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform TEXT NOT NULL, -- e.g. 'OpenAI', 'Anthropic', 'Google', 'n8n', 'Base44', 'Kimi'
    key_type TEXT NOT NULL DEFAULT 'API_KEY', -- e.g. 'API_KEY', 'SECRET', 'WEBHOOK_URL', 'IP_ADDRESS'
    encrypted_value TEXT NOT NULL, -- to store the actual secret securely
    status TEXT DEFAULT 'active' NOT NULL, -- 'active', 'low_balance', 'expired'
    balance NUMERIC(10,2) DEFAULT 100.00 NOT NULL,
    auto_recharge_threshold NUMERIC(10,2) DEFAULT 10.00 NOT NULL,
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

ALTER TABLE public.vault_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow select on vault" ON public.vault_credentials FOR SELECT USING (true);
CREATE POLICY "Allow insert on vault" ON public.vault_credentials FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on vault" ON public.vault_credentials FOR UPDATE USING (true);
CREATE POLICY "Allow delete on vault" ON public.vault_credentials FOR DELETE USING (true);

-- -------------------------------------------------------------
-- 5. Create table for Credentials Usage Logs
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.credential_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    credential_id UUID REFERENCES public.vault_credentials(id) ON DELETE CASCADE,
    tokens_used INTEGER DEFAULT 0 NOT NULL,
    cost NUMERIC(10,6) DEFAULT 0.000000 NOT NULL,
    model TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

ALTER TABLE public.credential_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow select on logs" ON public.credential_usage_logs FOR SELECT USING (true);
CREATE POLICY "Allow insert on logs" ON public.credential_usage_logs FOR INSERT WITH CHECK (true);

-- -------------------------------------------------------------
-- 6. Create table for App Notification Alerts
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.app_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title_ar TEXT NOT NULL,
    title_en TEXT NOT NULL,
    message_ar TEXT NOT NULL,
    message_en TEXT NOT NULL,
    type TEXT DEFAULT 'info' NOT NULL,
    is_read BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

ALTER TABLE public.app_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow select on notifications" ON public.app_notifications FOR SELECT USING (true);
CREATE POLICY "Allow insert on notifications" ON public.app_notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on notifications" ON public.app_notifications FOR UPDATE USING (true);

-- -------------------------------------------------------------
-- 7. Monthly Expenses Consolidated Analytics View
-- -------------------------------------------------------------
CREATE OR REPLACE VIEW public.monthly_expenses_view AS
SELECT 
    TO_CHAR(COALESCE(u.timestamp, NOW()), 'YYYY-MM') AS month,
    COALESCE(c.platform, 'Unknown') AS platform,
    SUM(u.cost)::NUMERIC(10,2) AS total_cost
FROM public.credential_usage_logs u
LEFT JOIN public.vault_credentials c ON u.credential_id = c.id
GROUP BY month, platform;


-- -------------------------------------------------------------
-- 8. Smart Multi-Key Management System Table (secret_keys)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.secret_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform TEXT NOT NULL,                  -- e.g., 'OpenAI', 'Google', 'Anthropic', etc.
    key_name TEXT NOT NULL,                  -- friendly name like 'Gemini-1', 'Space-2'
    key_type TEXT NOT NULL,                  -- API_KEY, SECRET_KEY, WEBHOOK_URL, etc.
    encrypted_value TEXT NOT NULL,           -- Encrypted value
    official_link TEXT,                      -- Link to claim key
    status TEXT DEFAULT 'active' NOT NULL,   -- active, low, expired
    balance NUMERIC(10,2) DEFAULT 100.00 NOT NULL,
    usage_count INTEGER DEFAULT 0 NOT NULL,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

ALTER TABLE public.secret_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow select on secret_keys" ON public.secret_keys FOR SELECT USING (true);
CREATE POLICY "Allow insert on secret_keys" ON public.secret_keys FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on secret_keys" ON public.secret_keys FOR UPDATE USING (true);
CREATE POLICY "Allow delete on secret_keys" ON public.secret_keys FOR DELETE USING (true);


-- -------------------------------------------------------------
-- 9. Real-Time Cloud Databases Registry (databases_registry)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.databases_registry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    db_name TEXT NOT NULL,
    db_type TEXT NOT NULL,                    -- PostgreSQL, MongoDB, MySQL, Firebase, Supabase, etc.
    connection_string TEXT NOT NULL,          -- Encrypted connection string or host url
    status TEXT DEFAULT 'online' NOT NULL,    -- online, offline
    tables_count INTEGER DEFAULT 0 NOT NULL,
    storage_used NUMERIC(10,2) DEFAULT 0.00 NOT NULL, -- in MB
    last_checked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.databases_registry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow select on databases_registry" ON public.databases_registry FOR SELECT USING (true);
CREATE POLICY "Allow insert on databases_registry" ON public.databases_registry FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on databases_registry" ON public.databases_registry FOR UPDATE USING (true);
CREATE POLICY "Allow delete on databases_registry" ON public.databases_registry FOR DELETE USING (true);


-- -------------------------------------------------------------
-- 10. Key Usage Logs Tracking (key_usage_tracking)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.key_usage_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key_id UUID REFERENCES public.secret_keys(id) ON DELETE CASCADE,
    used_in_page TEXT NOT NULL,               -- e.g., 'Optimizer', 'Automation'
    used_in_component TEXT NOT NULL,          -- e.g., 'AIAssistantModal'
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

ALTER TABLE public.key_usage_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow select on key_usage_tracking" ON public.key_usage_tracking FOR SELECT USING (true);
CREATE POLICY "Allow insert on key_usage_tracking" ON public.key_usage_tracking FOR INSERT WITH CHECK (true);


