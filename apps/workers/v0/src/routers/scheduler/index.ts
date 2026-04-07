import type {
  CreateScheduledJobInput,
  GetJobSnapshotsInput,
  ListJobRunsInput,
  ListScheduledJobsInput,
  UpdateScheduledJobInput,
} from '@deepcrawl/types/routers/scheduler/types';
import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';
import { cors } from 'hono/cors';
import { z } from 'zod';
import type { ORPCContext } from '@/lib/context';

const scheduler = new Hono<{ Bindings: Env }>();

// Helper to parse cron expression
function parseCronToNextRun(cronExpression: string, timezone = 'UTC'): Date {
  // Simplified cron parser - for production use a library like cron-parser
  const parts = cronExpression.split(' ');
  if (parts.length < 5) {
    // Fallback to interval (minutes)
    const minutes = Number.parseInt(cronExpression, 10) || 60;
    return new Date(Date.now() + minutes * 60 * 1000);
  }

  // For now, return a default next run time
  // In production, implement proper cron parsing
  return new Date(Date.now() + 60 * 60 * 1000); // 1 hour
}

// Helper to calculate next run based on schedule
function calculateNextRun(
  scheduleType: string,
  scheduleValue: string,
  timezone = 'UTC',
): Date {
  const now = new Date();

  switch (scheduleType) {
    case 'interval': {
      const minutes = Number.parseInt(scheduleValue, 10) || 60;
      return new Date(now.getTime() + minutes * 60 * 1000);
    }
    case 'cron':
      return parseCronToNextRun(scheduleValue, timezone);
    case 'daily': {
      const [hour, minute] = scheduleValue.split(':').map(Number);
      const next = new Date(now);
      next.setHours(hour, minute, 0, 0);
      if (next <= now) {
        next.setDate(next.getDate() + 1);
      }
      return next;
    }
    case 'weekly': {
      const [day, hour, minute] = scheduleValue.split(' ');
      const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
      const targetDay = days.indexOf(day.toLowerCase());
      const next = new Date(now);
      next.setHours(
        Number.parseInt(hour, 10) || 0,
        Number.parseInt(minute, 10) || 0,
        0,
        0,
      );
      const currentDay = next.getDay();
      let daysUntil = targetDay - currentDay;
      if (daysUntil < 0 || (daysUntil === 0 && next <= now)) {
        daysUntil += 7;
      }
      next.setDate(next.getDate() + daysUntil);
      return next;
    }
    default:
      return new Date(now.getTime() + 60 * 60 * 1000);
  }
}

// Change detection logic
function detectChanges(
  oldContent: string | null,
  newContent: string,
  mode: string,
  threshold: number,
): { hasChanged: boolean; diffPercentage: number; changeType: string } {
  if (!oldContent) {
    return { hasChanged: true, diffPercentage: 100, changeType: 'content' };
  }

  if (mode === 'content_hash') {
    const oldHash = simpleHash(oldContent);
    const newHash = simpleHash(newContent);
    const hasChanged = oldHash !== newHash;
    return {
      hasChanged,
      diffPercentage: hasChanged ? 100 : 0,
      changeType: 'content',
    };
  }

  if (mode === 'diff') {
    // Simple diff calculation
    const oldWords = oldContent.split(/\s+/);
    const newWords = newContent.split(/\s+/);

    const added = newWords.filter((w) => !oldWords.includes(w)).length;
    const removed = oldWords.filter((w) => !newWords.includes(w)).length;
    const totalWords = Math.max(oldWords.length, newWords.length);

    const diffPercentage =
      totalWords > 0 ? Math.round(((added + removed) / totalWords) * 100) : 0;

    return {
      hasChanged: diffPercentage >= threshold,
      diffPercentage,
      changeType: added > removed ? 'content' : 'content',
    };
  }

  return { hasChanged: false, diffPercentage: 0, changeType: 'none' };
}

// Simple hash function
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

// Create scheduled job
scheduler.post('/jobs', async (c) => {
  const body = await c.req.json();
  const validated = CreateScheduledJobSchema.parse(body);

  const id = crypto.randomUUID();
  const userId = 'default-user'; // TODO: Get from auth
  const nextRunAt = calculateNextRun(
    validated.scheduleType,
    validated.scheduleValue,
    validated.timezone,
  );
  const now = new Date().toISOString();

  const job = {
    id,
    userId,
    name: validated.name,
    description: validated.description || null,
    url: validated.url,
    operation: validated.operation,
    options: validated.options || {},
    scheduleType: validated.scheduleType,
    scheduleValue: validated.scheduleValue,
    timezone: validated.timezone,
    enableChangeDetection: validated.enableChangeDetection ?? true,
    changeDetectionMode: validated.changeDetectionMode || 'content_hash',
    diffThreshold: validated.diffThreshold || null,
    notifyOnChange: validated.notifyOnChange ?? true,
    notifyOnError: validated.notifyOnError ?? true,
    webhookUrl: validated.webhookUrl || null,
    notificationChannels: validated.notificationChannels || ['webhook'],
    isActive: true,
    lastRunAt: null,
    nextRunAt: nextRunAt.toISOString(),
    runCount: 0,
    errorCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  // Store in KV (for now, use in-memory or KV)
  const kvKey = `scheduler:job:${id}`;
  await c.env.KV.put(kvKey, JSON.stringify(job));

  // Add to schedule queue
  const queueKey = `scheduler:queue:${nextRunAt.getTime()}`;
  const existing = await c.env.KV.get(queueKey);
  const queue = existing ? JSON.parse(existing) : [];
  queue.push({ jobId: id, scheduledFor: nextRunAt.toISOString() });
  await c.env.KV.put(queueKey, JSON.stringify(queue));

  return c.json({ success: true, data: job });
});

// List scheduled jobs
scheduler.get('/jobs', async (c) => {
  const limit = Number.parseInt(c.req.query('limit') || '20');
  const offset = Number.parseInt(c.req.query('offset') || '0');
  const isActive = c.req.query('isActive');

  // Get all jobs from KV
  const list = await c.env.KV.list({ prefix: 'scheduler:job:' });
  let jobs = await Promise.all(
    list.keys.map(async (key) => {
      const data = await c.env.KV.get(key.name);
      return data ? JSON.parse(data) : null;
    }),
  );

  jobs = jobs.filter(Boolean);

  if (isActive !== undefined) {
    const activeFilter = isActive === 'true';
    jobs = jobs.filter((j: any) => j.isActive === activeFilter);
  }

  jobs.sort(
    (a: any, b: any) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return c.json({
    success: true,
    data: jobs.slice(offset, offset + limit),
    meta: {
      total: jobs.length,
      limit,
      offset,
    },
  });
});

// Get single job
scheduler.get('/jobs/:id', async (c) => {
  const id = c.req.param('id');
  const jobKey = `scheduler:job:${id}`;
  const job = await c.env.KV.get(jobKey);

  if (!job) {
    return c.json({ success: false, error: 'Job not found' }, 404);
  }

  return c.json({ success: true, data: JSON.parse(job) });
});

// Update scheduled job
scheduler.patch('/jobs/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const validated = UpdateScheduledJobSchema.parse(body);

  const jobKey = `scheduler:job:${id}`;
  const existing = await c.env.KV.get(jobKey);

  if (!existing) {
    return c.json({ success: false, error: 'Job not found' }, 404);
  }

  const job = JSON.parse(existing);
  const updated = {
    ...job,
    ...validated,
    updatedAt: new Date().toISOString(),
  };

  // Recalculate next run if schedule changed
  if (validated.scheduleType || validated.scheduleValue) {
    updated.nextRunAt = calculateNextRun(
      updated.scheduleType,
      updated.scheduleValue,
      updated.timezone,
    ).toISOString();
  }

  await c.env.KV.put(jobKey, JSON.stringify(updated));

  return c.json({ success: true, data: updated });
});

// Delete scheduled job
scheduler.delete('/jobs/:id', async (c) => {
  const id = c.req.param('id');
  const jobKey = `scheduler:job:${id}`;

  await c.env.KV.delete(jobKey);

  return c.json({ success: true });
});

// Trigger job manually
scheduler.post('/jobs/:id/trigger', async (c) => {
  const id = c.req.param('id');
  const jobKey = `scheduler:job:${id}`;
  const job = await c.env.KV.get(jobKey);

  if (!job) {
    return c.json({ success: false, error: 'Job not found' }, 404);
  }

  const jobData = JSON.parse(job);
  const runId = crypto.randomUUID();
  const startedAt = new Date().toISOString();

  // Create run record
  const runKey = `scheduler:run:${runId}`;
  const run = {
    id: runId,
    jobId: id,
    status: 'running',
    startedAt,
    completedAt: null,
    duration: null,
    success: null,
    responseHash: null,
    responseSize: null,
    hasChanged: null,
    changeType: null,
    changeSummary: null,
    diffPercentage: null,
    error: null,
    createdAt: startedAt,
  };
  await c.env.KV.put(runKey, JSON.stringify(run));

  // Execute the crawl
  try {
    // Call the read endpoint based on operation
    let content = '';
    let metadata = null;

    const apiUrl =
      c.env.DEEPCRAWL_API_URL ||
      'https://deepcrawl-worker-v0-production.shinzero.workers.dev';
    const apiKey = c.env.DEEPCRAWL_API_KEY || 'dc_dev_key_12345';

    const endpoint = jobData.operation === 'markdown' ? '/markdown' : '/read';
    const response = await fetch(`${apiUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: jobData.url,
        ...(jobData.operation === 'read' && { metadata: true }),
      }),
    });

    const result = await response.json();

    if (jobData.operation === 'markdown') {
      content = result;
    } else {
      content = result.markdown || result.cleanedHtml || '';
      metadata = result.metadata;
    }

    const newHash = simpleHash(content);

    // Get previous snapshot
    const snapshotsKey = `scheduler:snapshots:${id}`;
    const snapshotsData = await c.env.KV.get(snapshotsKey);
    const snapshots = snapshotsData ? JSON.parse(snapshotsData) : [];
    const lastSnapshot = snapshots[0];

    // Detect changes
    let hasChanged = false;
    let changeType = null;
    let diffPercentage = 0;
    const summary = null;

    if (jobData.enableChangeDetection && lastSnapshot) {
      const changes = detectChanges(
        lastSnapshot.content,
        content,
        jobData.changeDetectionMode,
        jobData.diffThreshold || 0,
      );
      hasChanged = changes.hasChanged;
      changeType = changes.changeType;
      diffPercentage = changes.diffPercentage;
    }

    const completedAt = new Date().toISOString();

    // Update run record
    const updatedRun = {
      ...run,
      status: 'completed',
      completedAt,
      duration: new Date(completedAt).getTime() - new Date(startedAt).getTime(),
      success: true,
      responseHash: newHash,
      responseSize: content.length,
      hasChanged,
      changeType,
      diffPercentage,
    };
    await c.env.KV.put(runKey, JSON.stringify(updatedRun));

    // Save new snapshot
    const newSnapshot = {
      id: crypto.randomUUID(),
      jobId: id,
      runId,
      content: content.substring(0, 100000), // Limit storage
      contentHash: newHash,
      metadata,
      size: content.length,
      createdAt: completedAt,
    };

    snapshots.unshift(newSnapshot);
    // Keep only last 10 snapshots
    if (snapshots.length > 10) {
      snapshots.pop();
    }
    await c.env.KV.put(snapshotsKey, JSON.stringify(snapshots));

    // Update job stats
    const updatedJob = {
      ...jobData,
      lastRunAt: completedAt,
      nextRunAt: calculateNextRun(
        jobData.scheduleType,
        jobData.scheduleValue,
        jobData.timezone,
      ).toISOString(),
      runCount: (jobData.runCount || 0) + 1,
      updatedAt: completedAt,
    };
    await c.env.KV.put(jobKey, JSON.stringify(updatedJob));

    // Send webhook notification if enabled
    if (jobData.webhookUrl && (hasChanged || !jobData.enableChangeDetection)) {
      try {
        await fetch(jobData.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: hasChanged ? 'change_detected' : 'job_completed',
            timestamp: completedAt,
            job: { id: jobData.id, name: jobData.name, url: jobData.url },
            run: {
              id: runId,
              status: 'completed',
              hasChanged,
              changeType,
              diffPercentage,
            },
          }),
        });
      } catch (e) {
        console.error('Webhook failed:', e);
      }
    }

    return c.json({
      success: true,
      data: {
        run: updatedRun,
        hasChanged,
        changeType,
        diffPercentage,
      },
    });
  } catch (error) {
    const completedAt = new Date().toISOString();
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    // Update run with error
    const errorRun = {
      ...run,
      status: 'failed',
      completedAt,
      duration: new Date(completedAt).getTime() - new Date(startedAt).getTime(),
      success: false,
      error: { message: errorMessage },
    };
    await c.env.KV.put(runKey, JSON.stringify(errorRun));

    // Update job error count
    const errorJob = {
      ...jobData,
      errorCount: (jobData.errorCount || 0) + 1,
      lastRunAt: completedAt,
      updatedAt: completedAt,
    };
    await c.env.KV.put(jobKey, JSON.stringify(errorJob));

    return c.json(
      {
        success: false,
        error: errorMessage,
        run: errorRun,
      },
      500,
    );
  }
});

// Get job runs
scheduler.get('/jobs/:id/runs', async (c) => {
  const id = c.req.param('id');
  const limit = Number.parseInt(c.req.query('limit') || '20');
  const offset = Number.parseInt(c.req.query('offset') || '0');

  // List all runs for this job
  const list = await c.env.KV.list({ prefix: 'scheduler:run:' });
  let runs = await Promise.all(
    list.keys
      .filter((k) => k.name.includes(id))
      .map(async (key) => {
        const data = await c.env.KV.get(key.name);
        return data ? JSON.parse(data) : null;
      }),
  );

  runs = runs
    .filter(Boolean)
    .sort(
      (a, b) =>
        new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
    );

  return c.json({
    success: true,
    data: runs.slice(offset, offset + limit),
    meta: { total: runs.length, limit, offset },
  });
});

// Get job snapshots
scheduler.get('/jobs/:id/snapshots', async (c) => {
  const id = c.req.param('id');
  const limit = Number.parseInt(c.req.query('limit') || '10');

  const snapshotsKey = `scheduler:snapshots:${id}`;
  const data = await c.env.KV.get(snapshotsKey);
  const snapshots = data ? JSON.parse(data) : [];

  return c.json({
    success: true,
    data: snapshots.slice(0, limit),
  });
});

// Health check for scheduler
scheduler.get('/health', async (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

export default scheduler;
