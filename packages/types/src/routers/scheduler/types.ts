import { z } from 'zod';

export const ScheduleTypeEnum = [
  'interval',
  'cron',
  'daily',
  'weekly',
] as const;
export type ScheduleType = (typeof ScheduleTypeEnum)[number];

export const ChangeDetectionModeEnum = [
  'content_hash',
  'diff',
  'metadata',
] as const;
export type ChangeDetectionMode = (typeof ChangeDetectionModeEnum)[number];

export const NotificationChannelEnum = ['email', 'webhook', 'slack'] as const;
export type NotificationChannel = (typeof NotificationChannelEnum)[number];

export const JobStatusEnum = [
  'pending',
  'running',
  'completed',
  'failed',
  'cancelled',
] as const;
export type JobStatus = (typeof JobStatusEnum)[number];

export const NotificationTypeEnum = [
  'change_detected',
  'error',
  'job_started',
  'job_completed',
] as const;
export type NotificationType = (typeof NotificationTypeEnum)[number];

export const OperationTypeEnum = [
  'read',
  'markdown',
  'extract',
  'links',
] as const;
export type OperationType = (typeof OperationTypeEnum)[number];

export const CreateScheduledJobSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  url: z.string().url(),
  operation: z.enum(OperationTypeEnum),
  options: z.record(z.string(), z.unknown()).optional(),

  scheduleType: z.enum(ScheduleTypeEnum),
  scheduleValue: z.string().min(1),
  timezone: z.string().optional().default('UTC'),

  enableChangeDetection: z.boolean().optional().default(true),
  changeDetectionMode: z
    .enum(ChangeDetectionModeEnum)
    .optional()
    .default('content_hash'),
  diffThreshold: z.number().min(0).max(100).optional(),

  notifyOnChange: z.boolean().optional().default(true),
  notifyOnError: z.boolean().optional().default(true),
  webhookUrl: z.string().url().optional(),
  notificationChannels: z
    .array(z.enum(NotificationChannelEnum))
    .optional()
    .default(['webhook']),
});
export type CreateScheduledJobInput = z.infer<typeof CreateScheduledJobSchema>;

export const UpdateScheduledJobSchema =
  CreateScheduledJobSchema.partial().extend({
    isActive: z.boolean().optional(),
  });
export type UpdateScheduledJobInput = z.infer<typeof UpdateScheduledJobSchema>;

export const ScheduledJobResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  url: z.string(),
  operation: z.enum(OperationTypeEnum),
  options: z.record(z.string(), z.unknown()).nullable(),

  scheduleType: z.enum(ScheduleTypeEnum),
  scheduleValue: z.string(),
  timezone: z.string(),

  enableChangeDetection: z.boolean(),
  changeDetectionMode: z.enum(ChangeDetectionModeEnum),
  diffThreshold: z.number().nullable(),

  notifyOnChange: z.boolean(),
  notifyOnError: z.boolean(),
  webhookUrl: z.string().nullable(),
  notificationChannels: z.array(z.enum(NotificationChannelEnum)),

  isActive: z.boolean(),
  lastRunAt: z.string().nullable(),
  nextRunAt: z.string().nullable(),
  runCount: z.number(),
  errorCount: z.number(),

  createdAt: z.string(),
  updatedAt: z.string(),
});
export type ScheduledJobResponse = z.infer<typeof ScheduledJobResponseSchema>;

export const ListScheduledJobsSchema = z.object({
  limit: z.number().int().min(1).max(100).optional().default(20),
  offset: z.number().int().min(0).optional().default(0),
  isActive: z.boolean().optional(),
});
export type ListScheduledJobsInput = z.infer<typeof ListScheduledJobsSchema>;

export const JobRunResponseSchema = z.object({
  id: z.string(),
  jobId: z.string(),
  status: z.enum(JobStatusEnum),
  startedAt: z.string(),
  completedAt: z.string().nullable(),
  duration: z.number().nullable(),

  success: z.boolean().nullable(),
  responseHash: z.string().nullable(),
  responseSize: z.number().nullable(),

  hasChanged: z.boolean().nullable(),
  changeType: z.string().nullable(),
  changeSummary: z.record(z.string(), z.unknown()).nullable(),
  diffPercentage: z.number().nullable(),

  error: z.record(z.string(), z.unknown()).nullable(),

  createdAt: z.string(),
});
export type JobRunResponse = z.infer<typeof JobRunResponseSchema>;

export const ListJobRunsSchema = z.object({
  jobId: z.string(),
  limit: z.number().int().min(1).max(100).optional().default(20),
  offset: z.number().int().min(0).optional().default(0),
  status: z.enum(JobStatusEnum).optional(),
});
export type ListJobRunsInput = z.infer<typeof ListJobRunsSchema>;

export const ChangeSummarySchema = z.object({
  type: z.enum(['content', 'metadata', 'structure']),
  percentage: z.number(),
  details: z.record(z.string(), z.unknown()),
  added: z.array(z.string()).optional(),
  removed: z.array(z.string()).optional(),
  modified: z.array(z.string()).optional(),
});
export type ChangeSummary = z.infer<typeof ChangeSummarySchema>;

export const WebhookPayloadSchema = z.object({
  event: z.string(),
  timestamp: z.string(),
  job: z.object({
    id: z.string(),
    name: z.string(),
    url: z.string(),
  }),
  run: z.object({
    id: z.string(),
    status: z.enum(JobStatusEnum),
    hasChanged: z.boolean(),
    changeType: z.string().nullable(),
    diffPercentage: z.number().nullable(),
  }),
  changes: ChangeSummarySchema.optional(),
  error: z.record(z.string(), z.unknown()).optional(),
});
export type WebhookPayload = z.infer<typeof WebhookPayloadSchema>;

export const CalculateChangesSchema = z.object({
  jobId: z.string(),
  oldContent: z.string().optional(),
  newContent: z.string(),
  oldMetadata: z.record(z.string(), z.unknown()).optional(),
  newMetadata: z.record(z.string(), z.unknown()).optional(),
  mode: z.enum(ChangeDetectionModeEnum),
  threshold: z.number().min(0).max(100).optional().default(0),
});
export type CalculateChangesInput = z.infer<typeof CalculateChangesSchema>;

export const CalculateChangesResponseSchema = z.object({
  hasChanged: z.boolean(),
  changeType: z.string().nullable(),
  diffPercentage: z.number().nullable(),
  summary: ChangeSummarySchema.optional(),
});
export type CalculateChangesResponse = z.infer<
  typeof CalculateChangesResponseSchema
>;

export const TriggerJobSchema = z.object({
  jobId: z.string(),
});
export type TriggerJobInput = z.infer<typeof TriggerJobSchema>;

export const GetJobRunsSchema = z.object({
  jobId: z.string(),
  limit: z.number().int().min(1).max(100).optional().default(20),
  offset: z.number().int().min(0).optional().default(0),
});
export type GetJobRunsInput = z.infer<typeof GetJobRunsSchema>;

export const GetJobSnapshotsSchema = z.object({
  jobId: z.string(),
  limit: z.number().int().min(1).max(50).optional().default(10),
});
export type GetJobSnapshotsInput = z.infer<typeof GetJobSnapshotsSchema>;

export const JobSnapshotResponseSchema = z.object({
  id: z.string(),
  jobId: z.string(),
  runId: z.string(),
  contentHash: z.string(),
  metadata: z.record(z.string(), z.unknown()).nullable(),
  size: z.number().nullable(),
  createdAt: z.string(),
});
export type JobSnapshotResponse = z.infer<typeof JobSnapshotResponseSchema>;
