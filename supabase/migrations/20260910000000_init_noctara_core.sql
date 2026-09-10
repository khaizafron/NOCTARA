-- NOCTARA Core Database Migration
-- Single-User Private AI World for ROOT (Khai)

CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";
CREATE EXTENSION IF NOT EXISTS \"vector\";

-- 1. ROOT Identity
CREATE TABLE IF NOT EXISTS root_identity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT NOT NULL UNIQUE DEFAULT 'Khai',
    role TEXT NOT NULL DEFAULT 'ROOT',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Agents Registry
CREATE TABLE IF NOT EXISTS agents (
    id TEXT PRIMARY KEY, -- 'NOX' or 'ARIA'
    name TEXT NOT NULL,
    archetype TEXT NOT NULL,
    gender TEXT NOT NULL,
    system_prompt TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO agents (id, name, archetype, gender, system_prompt)
VALUES 
('NOX', 'NOX', 'Technical Operator / Executor / Skeptic', 'male', 'You are NOX, the primary execution entity of NOCTARA.'),
('ARIA', 'ARIA', 'Companion Intelligence / Reflective Strategist', 'female', 'You are ARIA, companion intelligence and context keeper of NOCTARA.')
ON CONFLICT (id) DO NOTHING;

-- 3. Conversations & Messages
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    speaker TEXT NOT NULL, -- 'ROOT', 'NOX', 'ARIA', 'SYSTEM'
    content TEXT NOT NULL,
    tool_calls JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. 7-Layer Durable Memory
CREATE TABLE IF NOT EXISTS memories (
    id TEXT PRIMARY KEY,
    scope TEXT NOT NULL CHECK (scope IN ('shared', 'aria', 'nox', 'project', 'root')),
    layer TEXT NOT NULL CHECK (layer IN ('working', 'episodic', 'semantic', 'identity', 'pattern', 'project', 'tool_learning')),
    type TEXT NOT NULL CHECK (type IN ('FACT', 'PREFERENCE', 'DECISION', 'PATTERN', 'PROJECT', 'LEARNING', 'WORKING', 'UNKNOWN')),
    content TEXT NOT NULL,
    source_type TEXT NOT NULL CHECK (source_type IN ('conversation', 'file', 'tool', 'owner_statement', 'agent_inference')),
    source_ref TEXT,
    confidence FLOAT NOT NULL DEFAULT 0.8,
    importance FLOAT NOT NULL DEFAULT 0.5,
    verification_status TEXT NOT NULL DEFAULT 'VERIFIED' CHECK (verification_status IN ('VERIFIED', 'INFERRED', 'UNVERIFIED', 'OUTDATED', 'CORRECTED')),
    supersedes_id TEXT REFERENCES memories(id) ON DELETE SET NULL,
    embedding vector(1536),
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_memories_scope ON memories(scope);
CREATE INDEX IF NOT EXISTS idx_memories_layer ON memories(layer);
CREATE INDEX IF NOT EXISTS idx_memories_type ON memories(type);
CREATE INDEX IF NOT EXISTS idx_memories_verification ON memories(verification_status);

-- 5. Autonomous Tasks and Plans
CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    goal TEXT NOT NULL,
    assigned_agent TEXT NOT NULL REFERENCES agents(id),
    status TEXT NOT NULL CHECK (status IN ('PENDING', 'PLANNING', 'EXECUTING', 'VERIFYING', 'AWAITING_APPROVAL', 'COMPLETED', 'FAILED', 'CANCELLED')),
    max_tool_budget INT NOT NULL DEFAULT 15,
    executed_tool_count INT NOT NULL DEFAULT 0,
    error TEXT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS plan_steps (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    step_order INT NOT NULL,
    description TEXT NOT NULL,
    action_type TEXT NOT NULL,
    tool_id TEXT,
    arguments JSONB,
    status TEXT NOT NULL CHECK (status IN ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'SKIPPED')),
    autonomy_class TEXT NOT NULL CHECK (autonomy_class IN ('A0', 'A1', 'A2', 'A3', 'A4')),
    requires_root_approval BOOLEAN NOT NULL DEFAULT FALSE,
    output JSONB,
    error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. A4 Approvals Gate
CREATE TABLE IF NOT EXISTS approvals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id TEXT REFERENCES tasks(id) ON DELETE CASCADE,
    step_id TEXT REFERENCES plan_steps(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,
    description TEXT NOT NULL,
    parameters JSONB,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    responded_at TIMESTAMPTZ
);

-- 7. Audit Logging
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor TEXT NOT NULL,
    action_type TEXT NOT NULL,
    details JSONB,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
