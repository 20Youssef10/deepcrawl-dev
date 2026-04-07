import { sql } from 'drizzle-orm';
import {
  index,
  integer,
  real,
  sqliteTable,
  text,
} from 'drizzle-orm/sqlite-core';

/**
 * Unified activity log - tracks all API requests across endpoints
 * Lightweight table for fast activity tracking and analytics
 */
export const activityLog = sqliteTable(
  'activity_log',
  {
    // Primary identification
    id: text('id').primaryKey(),
    userId: text('user_id'),

    // Request metadata
    path: text('path').notNull(), // such as 'read-getMarkdown' or 'links-extractLinks'
    success: integer('success', { mode: 'boolean' }).notNull(),
    cached: integer('cached', { mode: 'boolean' }),
    requestTimestamp: text('request_timestamp').notNull(),

    // URL and options
    requestUrl: text('request_url').notNull(), // Original URL before normalization
    requestOptions: text('request_options', { mode: 'json' }), // Full options JSON for reference

    // Performance metrics (fractional milliseconds)
    executionTimeMs: real('execution_time_ms'),

    // Response hash reference
    responseHash: text('response_hash').references(
      () => responseRecord.responseHash,
      { onDelete: 'set null', onUpdate: 'cascade' },
    ),
    // Response metadata reference such as metrics or full error response if success is false
    responseMetadata: text('response_metadata', { mode: 'json' }),

    // Error handling
    error: text('error', { mode: 'json' }), // NULL if success = true

    // Timestamps
    createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  },
  (table) => [
    // Primary user activity queries (dashboard timeline)
    index('idx_activity_user_timestamp').on(
      table.userId,
      table.requestTimestamp,
    ),

    // Endpoint-specific queries
    index('idx_activity_path_success').on(table.path, table.success),

    // Performance analytics
    index('idx_activity_execution_time')
      .on(table.executionTimeMs)
      .where(sql`${table.executionTimeMs} IS NOT NULL`),

    // URL-based queries
    index('idx_activity_request_url').on(table.requestUrl),

    // User success rate analysis
    index('idx_activity_user_success').on(
      table.userId,
      table.success,
      table.path,
    ),

    // Options hash for future content linking
    index('idx_activity_request_options').on(table.requestOptions),
  ],
);

/**
 * Store full response records for both read and links endpoints
 * Response storage - deduplicated response by hash
 */
export const responseRecord = sqliteTable(
  'response_record',
  {
    // Primary key - response hash for deduplication
    responseHash: text('response_hash').primaryKey(),

    // Request identification
    path: text('path').notNull(), // such as 'read-getMarkdown' or 'links-extractLinks'
    optionsHash: text('options_hash').notNull(),
    updatedBy: text('updated_by'), // such as 'user_id'

    // actual response content field
    responseContent: text('response_content', { mode: 'json' }),

    // content management
    responseSize: integer('response_size'),

    // Timestamps
    createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
    updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
  },
  (table) => [
    // Response hash lookup
    index('idx_response_record_response_hash').on(table.responseHash),

    // Updated by lookup
    index('idx_response_record_updated_by').on(table.updatedBy),

    // Options hash lookup
    index('idx_response_record_options').on(table.optionsHash),

    // Path lookup
    index('idx_response_record_path').on(table.path),

    // Updated at lookup
    index('idx_response_record_updated_at').on(table.updatedAt),

    // Created at lookup
    index('idx_response_record_created_at').on(table.createdAt),
  ],
);

// TypeScript types for all tables
export type ActivityLog = typeof activityLog.$inferSelect;
export type NewActivityLog = typeof activityLog.$inferInsert;
export type ResponseRecord = typeof responseRecord.$inferSelect;
export type NewResponseRecord = typeof responseRecord.$inferInsert;

/**
 * Scheduled Jobs - recurring web crawling jobs
 * Enables users to schedule automated crawling with change detection
 */
export const scheduledJobs = sqliteTable(
  'scheduled_jobs',
  {
    // Primary identification
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),

    // Job configuration
    name: text('name').notNull(),
    description: text('description'),
    url: text('url').notNull(),
    operation: text('operation').notNull(), // 'read', 'markdown', 'extract', 'links'
    options: text('options', { mode: 'json' }), // Operation-specific options

    // Schedule configuration
    scheduleType: text('schedule_type').notNull(), // 'interval', 'cron', 'daily', 'weekly'
    scheduleValue: text('schedule_value').notNull(), // e.g., '60' (minutes), '0 9 * * *' (cron)
    timezone: text('timezone').default('UTC'),

    // Change detection settings
    enableChangeDetection: integer('enable_change_detection', {
      mode: 'boolean',
    }).default(true),
    changeDetectionMode: text('change_detection_mode').default('content_hash'), // 'content_hash', 'diff', 'metadata'
    diffThreshold: real('diff_threshold'), // Percentage threshold for change alert

    // Notification settings
    notifyOnChange: integer('notify_on_change', { mode: 'boolean' }).default(
      true,
    ),
    notifyOnError: integer('notify_on_error', { mode: 'boolean' }).default(
      true,
    ),
    webhookUrl: text('webhook_url'),
    notificationChannels: text('notification_channels', { mode: 'json' }), // ['email', 'webhook', 'slack']

    // Status
    isActive: integer('is_active', { mode: 'boolean' }).default(true),
    lastRunAt: text('last_run_at'),
    nextRunAt: text('next_run_at'),
    runCount: integer('run_count').default(0),
    errorCount: integer('error_count').default(0),

    // Timestamps
    createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
    updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
  },
  (table) => [
    index('idx_scheduled_jobs_user').on(table.userId),
    index('idx_scheduled_jobs_active').on(table.isActive, table.nextRunAt),
    index('idx_scheduled_jobs_next_run').on(table.nextRunAt),
  ],
);

/**
 * Job Runs - history of each scheduled job execution
 */
export const jobRuns = sqliteTable(
  'job_runs',
  {
    // Primary identification
    id: text('id').primaryKey(),
    jobId: text('job_id').notNull(),

    // Run status
    status: text('status').notNull(), // 'pending', 'running', 'completed', 'failed', 'cancelled'
    startedAt: text('started_at').notNull(),
    completedAt: text('completed_at'),
    duration: integer('duration_ms'),

    // Result data
    success: integer('success', { mode: 'boolean' }),
    responseHash: text('response_hash'),
    responseSize: integer('response_size'),

    // Change detection
    hasChanged: integer('has_changed', { mode: 'boolean' }),
    changeType: text('change_type'), // 'content', 'metadata', 'structure'
    changeSummary: text('change_summary', { mode: 'json' }),
    diffPercentage: real('diff_percentage'),

    // Error information
    error: text('error', { mode: 'json' }),

    // Timestamps
    createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  },
  (table) => [
    index('idx_job_runs_job').on(table.jobId, table.startedAt),
    index('idx_job_runs_status').on(table.status),
    index('idx_job_runs_changed').on(table.hasChanged),
  ],
);

/**
 * Job Snapshots - stored snapshots for change detection
 * Keeps historical data for comparison
 */
export const jobSnapshots = sqliteTable(
  'job_snapshots',
  {
    // Primary identification
    id: text('id').primaryKey(),
    jobId: text('job_id').notNull(),
    runId: text('run_id').notNull(),

    // Snapshot data
    content: text('content'), // Markdown/HTML content
    contentHash: text('content_hash').notNull(),
    metadata: text('metadata', { mode: 'json' }),
    extractedData: text('extracted_data', { mode: 'json' }),

    // Storage info
    size: integer('size'),

    // Timestamps
    createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  },
  (table) => [
    index('idx_job_snapshots_job').on(table.jobId, table.createdAt),
    index('idx_job_snapshots_hash').on(table.contentHash),
  ],
);

/**
 * Notifications - log of sent notifications
 */
export const notifications = sqliteTable(
  'notifications',
  {
    // Primary identification
    id: text('id').primaryKey(),
    jobId: text('job_id'),
    runId: text('run_id'),

    // Notification details
    type: text('type').notNull(), // 'change_detected', 'error', 'job_started', 'job_completed'
    channel: text('channel').notNull(), // 'email', 'webhook', 'slack'
    status: text('status').notNull(), // 'pending', 'sent', 'failed'
    recipient: text('recipient'), // Email address or webhook URL

    // Payload
    payload: text('payload', { mode: 'json' }),
    response: text('response', { mode: 'json' }),

    // Timestamps
    sentAt: text('sent_at'),
    createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  },
  (table) => [
    index('idx_notifications_job').on(table.jobId),
    index('idx_notifications_status').on(table.status),
  ],
);

// TypeScript types for scheduled jobs tables
export type ScheduledJob = typeof scheduledJobs.$inferSelect;
export type NewScheduledJob = typeof scheduledJobs.$inferInsert;
export type JobRun = typeof jobRuns.$inferSelect;
export type NewJobRun = typeof jobRuns.$inferInsert;
export type JobSnapshot = typeof jobSnapshots.$inferSelect;
export type NewJobSnapshot = typeof jobSnapshots.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
