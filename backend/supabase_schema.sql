-- ====================================================================
-- AutoPilot AI - Supabase Cloud Database Schema & RLS Policies
-- ====================================================================
-- Instructions:
-- 1. Log in to your Supabase Dashboard: https://supabase.com/dashboard/project/tsgsgfsaavezdcpqqkpy
-- 2. In the left sidebar, click "SQL Editor".
-- 3. Click "New Query", paste the entire contents of this file, and click "Run".
-- 4. Verify that 4 tables are created: workflows, executions, tasks, settings.
-- ====================================================================

-- 1. Create workflows table
CREATE TABLE IF NOT EXISTS public.workflows (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'General',
    trigger_type TEXT DEFAULT 'manual',
    trigger_config JSONB DEFAULT '{}'::jsonb,
    steps JSONB NOT NULL DEFAULT '[]'::jsonb,
    edges JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Create executions table
CREATE TABLE IF NOT EXISTS public.executions (
    id TEXT PRIMARY KEY,
    workflow_id TEXT NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
    workflow_name TEXT NOT NULL,
    status TEXT NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    completed_at TIMESTAMPTZ,
    duration_seconds NUMERIC DEFAULT 0.0,
    step_results JSONB DEFAULT '[]'::jsonb,
    error_details TEXT,
    triggered_by TEXT DEFAULT 'manual',
    outputs JSONB DEFAULT '{}'::jsonb
);

-- 3. Create tasks table (Intelligent Task Board)
CREATE TABLE IF NOT EXISTS public.tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT DEFAULT 'medium',
    status TEXT DEFAULT 'todo',
    category TEXT DEFAULT 'General',
    deadline TEXT,
    estimated_hours NUMERIC DEFAULT 2.0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Create settings table
CREATE TABLE IF NOT EXISTS public.settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL
);

-- 5. Enable Row Level Security (RLS) on all tables
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- 6. Configure RLS Policies
-- Workflows Policies
DROP POLICY IF EXISTS "Allow public read workflows" ON public.workflows;
CREATE POLICY "Allow public read workflows" ON public.workflows
    FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow public insert workflows" ON public.workflows;
CREATE POLICY "Allow public insert workflows" ON public.workflows
    FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update workflows" ON public.workflows;
CREATE POLICY "Allow public update workflows" ON public.workflows
    FOR UPDATE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow public delete workflows" ON public.workflows;
CREATE POLICY "Allow public delete workflows" ON public.workflows
    FOR DELETE TO anon, authenticated USING (true);

-- Executions Policies
DROP POLICY IF EXISTS "Allow public read executions" ON public.executions;
CREATE POLICY "Allow public read executions" ON public.executions
    FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow public insert executions" ON public.executions;
CREATE POLICY "Allow public insert executions" ON public.executions
    FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update executions" ON public.executions;
CREATE POLICY "Allow public update executions" ON public.executions
    FOR UPDATE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow public delete executions" ON public.executions;
CREATE POLICY "Allow public delete executions" ON public.executions
    FOR DELETE TO anon, authenticated USING (true);

-- Tasks Policies
DROP POLICY IF EXISTS "Allow public read tasks" ON public.tasks;
CREATE POLICY "Allow public read tasks" ON public.tasks
    FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow public insert tasks" ON public.tasks;
CREATE POLICY "Allow public insert tasks" ON public.tasks
    FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update tasks" ON public.tasks;
CREATE POLICY "Allow public update tasks" ON public.tasks
    FOR UPDATE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow public delete tasks" ON public.tasks;
CREATE POLICY "Allow public delete tasks" ON public.tasks
    FOR DELETE TO anon, authenticated USING (true);

-- Settings Policies
DROP POLICY IF EXISTS "Allow public read settings" ON public.settings;
CREATE POLICY "Allow public read settings" ON public.settings
    FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow public insert settings" ON public.settings;
CREATE POLICY "Allow public insert settings" ON public.settings
    FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update settings" ON public.settings;
CREATE POLICY "Allow public update settings" ON public.settings
    FOR UPDATE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow public delete settings" ON public.settings;
CREATE POLICY "Allow public delete settings" ON public.settings
    FOR DELETE TO anon, authenticated USING (true);
