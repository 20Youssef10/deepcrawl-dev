'use client';

import {
  dcCreateScheduledJob,
  dcDeleteScheduledJob,
  dcGetJobRuns,
  dcGetJobSnapshots,
  dcGetScheduledJob,
  dcListScheduledJobs,
  dcTriggerScheduledJob,
  dcUpdateScheduledJob,
  type JobRun,
  type JobSnapshot,
  type ScheduledJob,
} from '@/query/scheduler-query.server';

const SCHEDULER_ENDPOINT = '/api/deepcrawl/scheduler';

function resolveAppOrigin(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }

  const envOrigin =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXT_PUBLIC_VERCEL_URL ??
    process.env.VERCEL_URL;

  if (envOrigin && envOrigin.length > 0) {
    return envOrigin.startsWith('http') ? envOrigin : `https://${envOrigin}`;
  }

  return 'http://localhost:3000';
}

function buildEndpoint(
  path: string,
  params?: Record<string, string | number | boolean | undefined>,
): string {
  const origin = resolveAppOrigin();
  const url = new URL(`${SCHEDULER_ENDPOINT}${path}`, origin);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    });
  }

  return url.toString();
}

export async function listScheduledJobsClient(params?: {
  limit?: number;
  offset?: number;
  isActive?: boolean;
}): Promise<{ success: boolean; data: ScheduledJob[] }> {
  const endpoint = buildEndpoint('/jobs', params);

  const response = await fetch(endpoint, {
    credentials: 'include',
    cache: 'no-store',
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: 'Failed to fetch' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export async function getScheduledJobClient(jobId: string): Promise<{
  success: boolean;
  data: ScheduledJob;
}> {
  const endpoint = buildEndpoint(`/jobs/${jobId}`);

  const response = await fetch(endpoint, {
    credentials: 'include',
    cache: 'no-store',
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: 'Failed to fetch' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export async function createScheduledJobClient(input: {
  name: string;
  url: string;
  operation?: string;
  scheduleType?: string;
  scheduleValue?: string;
  timezone?: string;
  description?: string;
  enableChangeDetection?: boolean;
  changeDetectionMode?: string;
  diffThreshold?: number;
  notifyOnChange?: boolean;
  notifyOnError?: boolean;
  webhookUrl?: string;
}): Promise<{ success: boolean; data: ScheduledJob }> {
  const endpoint = buildEndpoint('/jobs');

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    cache: 'no-store',
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: 'Failed to create' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export async function updateScheduledJobClient(
  jobId: string,
  input: Partial<{
    name: string;
    url: string;
    isActive: boolean;
    scheduleType: string;
    scheduleValue: string;
    webhookUrl: string;
    enableChangeDetection: boolean;
  }>,
): Promise<{ success: boolean; data: ScheduledJob }> {
  const endpoint = buildEndpoint(`/jobs/${jobId}`);

  const response = await fetch(endpoint, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    cache: 'no-store',
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: 'Failed to update' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export async function deleteScheduledJobClient(jobId: string): Promise<{
  success: boolean;
}> {
  const endpoint = buildEndpoint(`/jobs/${jobId}`);

  const response = await fetch(endpoint, {
    method: 'DELETE',
    credentials: 'include',
    cache: 'no-store',
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: 'Failed to delete' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export async function triggerScheduledJobClient(jobId: string): Promise<{
  success: boolean;
  data: {
    runId: string;
    hasChanged: boolean;
    changeType: string | null;
    diffPercentage: number;
  };
}> {
  const endpoint = buildEndpoint(`/jobs/${jobId}/trigger`);

  const response = await fetch(endpoint, {
    method: 'POST',
    credentials: 'include',
    cache: 'no-store',
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: 'Failed to trigger' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export async function getJobRunsClient(
  jobId: string,
  params?: { limit?: number; offset?: number },
): Promise<{ success: boolean; data: JobRun[] }> {
  const endpoint = buildEndpoint(`/jobs/${jobId}/runs`, params);

  const response = await fetch(endpoint, {
    credentials: 'include',
    cache: 'no-store',
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: 'Failed to fetch' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export async function getJobSnapshotsClient(
  jobId: string,
  params?: { limit?: number },
): Promise<{ success: boolean; data: JobSnapshot[] }> {
  const endpoint = buildEndpoint(`/jobs/${jobId}/snapshots`, params);

  const response = await fetch(endpoint, {
    credentials: 'include',
    cache: 'no-store',
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: 'Failed to fetch' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}
