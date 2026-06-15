-- Phase 7.5: AxiomID Edge Database Schema
-- Migrated from axiom-reset-api D1 tables to AxiomID identity tables

-- Harvest results from Perplexity queries
CREATE TABLE IF NOT EXISTS harvest_results (
  id TEXT PRIMARY KEY,
  query TEXT NOT NULL,
  result TEXT NOT NULL,
  citations TEXT, -- JSON array of citation URLs
  user_did TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_harvest_user ON harvest_results(user_did);
CREATE INDEX IF NOT EXISTS idx_harvest_created ON harvest_results(created_at);

-- Agent presence tracking (complements Durable Object)
CREATE TABLE IF NOT EXISTS agent_presence (
  agent_id TEXT PRIMARY KEY,
  status TEXT DEFAULT 'offline',
  last_heartbeat INTEGER,
  metadata TEXT -- JSON blob for agent-specific data
);

-- Trust delegations (who trusts whom)
CREATE TABLE IF NOT EXISTS trust_delegations (
  delegator_did TEXT NOT NULL,
  delegatee_did TEXT NOT NULL,
  trust_level REAL DEFAULT 0.5,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME,
  PRIMARY KEY (delegator_did, delegatee_did)
);
CREATE INDEX IF NOT EXISTS idx_delegation_delegatee ON trust_delegations(delegatee_did);

-- Installed skills (marketplace)
CREATE TABLE IF NOT EXISTS skill_installs (
  id TEXT PRIMARY KEY,
  skill_slug TEXT NOT NULL,
  user_did TEXT NOT NULL,
  version TEXT,
  installed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(skill_slug, user_did)
);
