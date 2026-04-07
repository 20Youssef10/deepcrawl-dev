-- Migration: Add scheduled jobs tables
-- Created: 2026-04-07

-- Scheduled Jobs table
CREATE TABLE IF NOT EXISTS scheduled_jobs (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  operation TEXT NOT NULL,
  options TEXT DEFAULT '{}',
  schedule_type TEXT NOT NULL,
  schedule_value TEXT NOT NULL,
  timezone TEXT DEFAULT 'UTC',
  enable_change_detection INTEGER DEFAULT 1,
  change_detection_mode TEXT DEFAULT 'content_hash',
  diff_threshold REAL,
  notify_on_change INTEGER DEFAULT 1,
  notify_on_error INTEGER DEFAULT 1,
  webhook_url TEXT,
  notification_channels TEXT DEFAULT '["webhook"]',
  is_active INTEGER DEFAULT 1,
  last_run_at TEXT,
  next_run_at TEXT,
  run_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_scheduled_jobs_user ON scheduled_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_jobs_active ON scheduled_jobs(is_active, next_run_at);
CREATE INDEX IF NOT EXISTS idx_scheduled_jobs_next_run ON scheduled_jobs(next_run_at);

-- Job Runs table
CREATE TABLE IF NOT EXISTS job_runs (
  id TEXT PRIMARY KEY NOT NULL,
  job_id TEXT NOT NULL,
  status TEXT NOT NULL,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  duration INTEGER,
  success INTEGER,
  response_hash TEXT,
  response_size INTEGER,
  has_changed INTEGER,
  change_type TEXT,
  change_summary TEXT,
  diff_percentage REAL,
  error TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_job_runs_job ON job_runs(job_id, started_at);
CREATE INDEX IF NOT EXISTS idx_job_runs_status ON job_runs(status);
CREATE INDEX IF NOT EXISTS idx_job_runs_changed ON job_runs(has_changed);

-- Job Snapshots table
CREATE TABLE IF NOT EXISTS job_snapshots (
  id TEXT PRIMARY KEY NOT NULL,
  job_id TEXT NOT NULL,
  run_id TEXT NOT NULL,
  content TEXT,
  content_hash TEXT NOT NULL,
  metadata TEXT,
  extracted_data TEXT,
  size INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_job_snapshots_job ON job_snapshots(job_id, created_at);
CREATE INDEX IF NOT EXISTS idx_job_snapshots_hash ON job_snapshots(content_hash);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY NOT NULL,
  job_id TEXT,
  run_id TEXT,
  type TEXT NOT NULL,
  channel TEXT NOT NULL,
  status TEXT NOT NULL,
  recipient TEXT,
  payload TEXT,
  response TEXT,
  sent_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_notifications_job ON notifications(job_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);