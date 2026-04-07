import { Hono } from 'hono';
import type { AppBindings, AppVariables, ORPCContext } from '@/lib/context';
import { createContext } from '@/lib/context';
import { processBatchRequest } from '@/routers/batch/batch.processor';

type SchedulerEnv = AppBindings;

const scheduler = new Hono<SchedulerEnv>();

// Helper to create proper ORPCContext from Hono context
async function createSchedulerContext(c: any): Promise<ORPCContext> {
  return await createContext({ context: c });
}

// Helper to parse cron expression
function parseCronToNextRun(cronExpression: string, timezone = 'UTC'): Date {
  const parts = cronExpression.split(' ');
  if (parts.length < 5) {
    const minutes = Number.parseInt(cronExpression, 10) || 60;
    return new Date(Date.now() + minutes * 60 * 1000);
  }
  return new Date(Date.now() + 60 * 60 * 1000);
}

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

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

function detectChanges(
  oldContent: string | null,
  newContent: string,
  mode: string,
  threshold: number,
) {
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
      changeType: 'content',
    };
  }

  return { hasChanged: false, diffPercentage: 0, changeType: 'none' };
}

// Create scheduled job
scheduler.post('/jobs', async (c) => {
  const body = await c.req.json();

  const id = crypto.randomUUID();
  const userId = 'default-user';
  const nextRunAt = calculateNextRun(
    body.scheduleType,
    body.scheduleValue,
    body.timezone,
  );
  const now = new Date().toISOString();

  const job = {
    id,
    user_id: userId,
    name: body.name,
    description: body.description || null,
    url: body.url,
    operation: body.operation,
    options: JSON.stringify(body.options || {}),
    schedule_type: body.scheduleType,
    schedule_value: body.scheduleValue,
    timezone: body.timezone || 'UTC',
    enable_change_detection: body.enableChangeDetection ? 1 : 0,
    change_detection_mode: body.changeDetectionMode || 'content_hash',
    diff_threshold: body.diffThreshold ?? null,
    notify_on_change: body.notifyOnChange ? 1 : 0,
    notify_on_error: body.notifyOnError ? 1 : 0,
    webhook_url: body.webhookUrl || null,
    notification_channels: JSON.stringify(
      body.notificationChannels || ['webhook'],
    ),
    is_active: 1,
    last_run_at: null,
    next_run_at: nextRunAt.toISOString(),
    run_count: 0,
    error_count: 0,
  };

  // Insert into D1
  try {
    const now = new Date().toISOString();
    await c.env.DB_V0.prepare(`
      INSERT INTO scheduled_jobs (
        id, user_id, name, description, url, operation, options,
        schedule_type, schedule_value, timezone,
        enable_change_detection, change_detection_mode, diff_threshold,
        notify_on_change, notify_on_error, webhook_url, notification_channels,
        is_active, last_run_at, next_run_at, run_count, error_count,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
      .bind(
        job.id,
        job.user_id,
        job.name,
        job.description || null,
        job.url,
        job.operation,
        job.options,
        job.schedule_type,
        job.schedule_value,
        job.timezone,
        job.enable_change_detection,
        job.change_detection_mode,
        job.diff_threshold,
        job.notify_on_change,
        job.notify_on_error,
        job.webhook_url || null,
        job.notification_channels,
        job.is_active,
        null,
        job.next_run_at,
        job.run_count,
        job.error_count,
        now,
        now,
      )
      .run();
  } catch (e) {
    console.error('DB Error creating job:', e);
    return c.json({ success: false, error: `Failed to create job: ${e}` }, 500);
  }

  return c.json({
    success: true,
    data: { ...job, enableChangeDetection: true },
  });
});

// List scheduled jobs
scheduler.get('/jobs', async (c) => {
  const limit = Number.parseInt(c.req.query('limit') || '20');
  const offset = Number.parseInt(c.req.query('offset') || '0');
  const isActive = c.req.query('isActive');

  let query = 'SELECT * FROM scheduled_jobs';
  const params: any[] = [];

  if (isActive !== undefined) {
    query += ' WHERE is_active = ?';
    params.push(isActive === 'true' ? 1 : 0);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  try {
    const { results } = await c.env.DB_V0.prepare(query)
      .bind(...params)
      .all();

    const countQuery =
      isActive !== undefined
        ? 'SELECT COUNT(*) as total FROM scheduled_jobs WHERE is_active = ?'
        : 'SELECT COUNT(*) as total FROM scheduled_jobs';
    const countParams =
      isActive !== undefined ? [isActive === 'true' ? 1 : 0] : [];
    const { results: countResults } = await c.env.DB_V0.prepare(countQuery)
      .bind(...countParams)
      .all();

    const jobs = (results || []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      name: row.name,
      description: row.description,
      url: row.url,
      operation: row.operation,
      options: JSON.parse(row.options || '{}'),
      scheduleType: row.schedule_type,
      scheduleValue: row.schedule_value,
      timezone: row.timezone,
      enableChangeDetection: row.enable_change_detection === 1,
      changeDetectionMode: row.change_detection_mode,
      diffThreshold: row.diff_threshold,
      notifyOnChange: row.notify_on_change === 1,
      notifyOnError: row.notify_on_error === 1,
      webhookUrl: row.webhook_url,
      notificationChannels: JSON.parse(row.notification_channels || '[]'),
      isActive: row.is_active === 1,
      lastRunAt: row.last_run_at,
      nextRunAt: row.next_run_at,
      runCount: row.run_count,
      errorCount: row.error_count,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return c.json({
      success: true,
      data: jobs,
      meta: { total: countResults[0]?.total || 0, limit, offset },
    });
  } catch (e) {
    console.error('DB Error:', e);
    return c.json({ success: false, error: 'Failed to list jobs' }, 500);
  }
});

// Get single job
scheduler.get('/jobs/:id', async (c) => {
  const id = c.req.param('id');

  try {
    const { results } = await c.env.DB_V0.prepare(
      'SELECT * FROM scheduled_jobs WHERE id = ?',
    )
      .bind(id)
      .all();

    if (!results || results.length === 0) {
      return c.json({ success: false, error: 'Job not found' }, 404);
    }

    const row: any = results[0];
    const job = {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      description: row.description,
      url: row.url,
      operation: row.operation,
      options: JSON.parse(row.options || '{}'),
      scheduleType: row.schedule_type,
      scheduleValue: row.schedule_value,
      timezone: row.timezone,
      enableChangeDetection: row.enable_change_detection === 1,
      changeDetectionMode: row.change_detection_mode,
      diffThreshold: row.diff_threshold,
      notifyOnChange: row.notify_on_change === 1,
      notifyOnError: row.notify_on_error === 1,
      webhookUrl: row.webhook_url,
      notificationChannels: JSON.parse(row.notification_channels || '[]'),
      isActive: row.is_active === 1,
      lastRunAt: row.last_run_at,
      nextRunAt: row.next_run_at,
      runCount: row.run_count,
      errorCount: row.error_count,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };

    return c.json({ success: true, data: job });
  } catch (e) {
    return c.json({ success: false, error: 'Failed to get job' }, 500);
  }
});

// Update scheduled job
scheduler.patch('/jobs/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const now = new Date().toISOString();

  // Build update query dynamically
  const updates: string[] = ['updated_at = ?'];
  const params: any[] = [now];

  if (body.name !== undefined) {
    updates.push('name = ?');
    params.push(body.name);
  }
  if (body.description !== undefined) {
    updates.push('description = ?');
    params.push(body.description);
  }
  if (body.url !== undefined) {
    updates.push('url = ?');
    params.push(body.url);
  }
  if (body.isActive !== undefined) {
    updates.push('is_active = ?');
    params.push(body.isActive ? 1 : 0);
  }
  if (body.scheduleType !== undefined) {
    updates.push('schedule_type = ?');
    params.push(body.scheduleType);
  }
  if (body.scheduleValue !== undefined) {
    updates.push('schedule_value = ?');
    params.push(body.scheduleValue);
  }
  if (body.webhookUrl !== undefined) {
    updates.push('webhook_url = ?');
    params.push(body.webhookUrl);
  }
  if (body.enableChangeDetection !== undefined) {
    updates.push('enable_change_detection = ?');
    params.push(body.enableChangeDetection ? 1 : 0);
  }

  // Recalculate next run if schedule changed
  if (body.scheduleType || body.scheduleValue) {
    const { results } = await c.env.DB_V0.prepare(
      'SELECT schedule_type, schedule_value, timezone FROM scheduled_jobs WHERE id = ?',
    )
      .bind(id)
      .all();
    if (results && results[0]) {
      const job: any = results[0];
      const newType = body.scheduleType || job.schedule_type;
      const newValue = body.scheduleValue || job.schedule_value;
      const nextRun = calculateNextRun(newType, newValue, job.timezone);
      updates.push('next_run_at = ?');
      params.push(nextRun.toISOString());
    }
  }

  params.push(id);

  try {
    await c.env.DB_V0.prepare(
      `UPDATE scheduled_jobs SET ${updates.join(', ')} WHERE id = ?`,
    )
      .bind(...params)
      .run();
    return c.json({ success: true });
  } catch (e) {
    return c.json({ success: false, error: 'Failed to update job' }, 500);
  }
});

// Delete scheduled job
scheduler.delete('/jobs/:id', async (c) => {
  const id = c.req.param('id');

  try {
    await c.env.DB_V0.prepare('DELETE FROM scheduled_jobs WHERE id = ?')
      .bind(id)
      .run();
    return c.json({ success: true });
  } catch (e) {
    return c.json({ success: false, error: 'Failed to delete job' }, 500);
  }
});

// Trigger job manually
scheduler.post('/jobs/:id/trigger', async (c) => {
  const id = c.req.param('id');
  const runId = crypto.randomUUID();
  const startedAt = new Date().toISOString();

  // Get job
  const { results: jobResults } = await c.env.DB_V0.prepare(
    'SELECT * FROM scheduled_jobs WHERE id = ?',
  )
    .bind(id)
    .all();
  if (!jobResults || jobResults.length === 0) {
    return c.json({ success: false, error: 'Job not found' }, 404);
  }

  const job: any = jobResults[0];

  // Create run record
  try {
    await c.env.DB_V0.prepare(`
      INSERT INTO job_runs (id, job_id, status, started_at, created_at)
      VALUES (?, ?, 'running', ?, ?)
    `)
      .bind(runId, id, startedAt, startedAt)
      .run();
  } catch (e) {
    console.error('Run insert error:', e);
  }

  const orpcContext = await createSchedulerContext(c);

  try {
    let batchResult: any;
    try {
      batchResult = await processBatchRequest(orpcContext, {
        items: [
          {
            id: '1',
            url: job.url,
            operation: { type: 'read', options: { metadata: true } },
          },
        ],
        parallel: false,
      });
    } catch (procError: any) {
      console.error(
        '[SCHEDULER] processBatchRequest threw:',
        procError?.message || procError,
      );
      throw procError;
    }

    // Extract the actual read result from batch response
    const readResult = batchResult?.results?.[0]?.data || null;

    // Use metadata for change detection
    const metadataJson = JSON.stringify(readResult?.metadata || {});
    const newHash = simpleHash(metadataJson);

    // Also try to get any available content
    let content = '';
    if (readResult?.markdown) {
      content = readResult.markdown;
    } else if (readResult?.cleanedHtml) {
      content = readResult.cleanedHtml;
    }

    // If no content, use metadata as content for change detection
    if (!content) {
      content = metadataJson;
    }

    const completedAt = new Date().toISOString();
    const duration =
      new Date(completedAt).getTime() - new Date(startedAt).getTime();

    // Get previous snapshot
    const { results: prevSnapshots } = await c.env.DB_V0.prepare(
      'SELECT content FROM job_snapshots WHERE job_id = ? ORDER BY created_at DESC LIMIT 1',
    )
      .bind(id)
      .all();

    const lastContent = prevSnapshots[0]?.content as string | null;

    // Detect changes
    let hasChanged = false;
    let changeType = null;
    let diffPercentage = 0;

    if (job.enable_change_detection === 1 && lastContent) {
      const changes = detectChanges(
        lastContent,
        content,
        job.change_detection_mode,
        job.diff_threshold || 0,
      );
      hasChanged = changes.hasChanged;
      changeType = changes.changeType;
      diffPercentage = changes.diffPercentage;
    } else if (!lastContent) {
      hasChanged = true;
      diffPercentage = 100;
    }

    // Update run
    await c.env.DB_V0.prepare(`
      UPDATE job_runs SET status = 'completed', completed_at = ?, duration = ?,
        success = 1, response_hash = ?, response_size = ?,
        has_changed = ?, change_type = ?, diff_percentage = ?
      WHERE id = ?
    `)
      .bind(
        completedAt,
        duration,
        newHash,
        content.length,
        hasChanged ? 1 : 0,
        changeType,
        diffPercentage,
        runId,
      )
      .run();

    // Save new snapshot
    await c.env.DB_V0.prepare(`
      INSERT INTO job_snapshots (id, job_id, run_id, content, content_hash, metadata, size, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
      .bind(
        crypto.randomUUID(),
        id,
        runId,
        content.substring(0, 100000),
        newHash,
        JSON.stringify(readResult?.metadata || {}),
        content.length,
        completedAt,
      )
      .run();

    // Update job stats
    await c.env.DB_V0.prepare(`
      UPDATE scheduled_jobs SET 
        last_run_at = ?, 
        run_count = run_count + 1,
        next_run_at = ?
      WHERE id = ?
    `)
      .bind(
        completedAt,
        calculateNextRun(
          job.schedule_type,
          job.schedule_value,
          job.timezone,
        ).toISOString(),
        id,
      )
      .run();

    // Send webhook notification
    if (job.webhook_url && hasChanged) {
      try {
        await fetch(job.webhook_url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'change_detected',
            timestamp: completedAt,
            job: { id: job.id, name: job.name, url: job.url },
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
      data: { runId, hasChanged, changeType, diffPercentage },
    });
  } catch (error) {
    const completedAt = new Date().toISOString();
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    await c.env.DB_V0.prepare(`
      UPDATE job_runs SET status = 'failed', completed_at = ?, success = 0, error = ?
      WHERE id = ?
    `)
      .bind(completedAt, JSON.stringify({ message: errorMessage }), runId)
      .run();

    await c.env.DB_V0.prepare(`
      UPDATE scheduled_jobs SET error_count = error_count + 1, last_run_at = ? WHERE id = ?
    `)
      .bind(completedAt, id)
      .run();

    return c.json({ success: false, error: errorMessage }, 500);
  }
});

// Get job runs
scheduler.get('/jobs/:id/runs', async (c) => {
  const id = c.req.param('id');
  const limit = Number.parseInt(c.req.query('limit') || '20');
  const offset = Number.parseInt(c.req.query('offset') || '0');

  try {
    const { results } = await c.env.DB_V0.prepare(
      'SELECT * FROM job_runs WHERE job_id = ? ORDER BY started_at DESC LIMIT ? OFFSET ?',
    )
      .bind(id, limit, offset)
      .all();

    const runs = (results || []).map((row: any) => ({
      id: row.id,
      jobId: row.job_id,
      status: row.status,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      duration: row.duration,
      success: row.success === 1,
      responseHash: row.response_hash,
      responseSize: row.response_size,
      hasChanged: row.has_changed === 1,
      changeType: row.change_type,
      diffPercentage: row.diff_percentage,
      error: row.error ? JSON.parse(row.error) : null,
      createdAt: row.created_at,
    }));

    return c.json({ success: true, data: runs });
  } catch (e) {
    return c.json({ success: false, error: 'Failed to get runs' }, 500);
  }
});

// Get job snapshots
scheduler.get('/jobs/:id/snapshots', async (c) => {
  const id = c.req.param('id');
  const limit = Number.parseInt(c.req.query('limit') || '10');

  try {
    const { results } = await c.env.DB_V0.prepare(
      'SELECT * FROM job_snapshots WHERE job_id = ? ORDER BY created_at DESC LIMIT ?',
    )
      .bind(id, limit)
      .all();

    const snapshots = (results || []).map((row: any) => ({
      id: row.id,
      jobId: row.job_id,
      runId: row.run_id,
      contentHash: row.content_hash,
      metadata: row.metadata ? JSON.parse(row.metadata) : null,
      size: row.size,
      createdAt: row.created_at,
    }));

    return c.json({ success: true, data: snapshots });
  } catch (e) {
    return c.json({ success: false, error: 'Failed to get snapshots' }, 500);
  }
});

// Health check
scheduler.get('/health', async (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default scheduler;
