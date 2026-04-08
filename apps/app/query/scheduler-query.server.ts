'use server';

import { headers } from 'next/headers';
import { buildDeepcrawlHeaders } from '@/lib/auth-mode';

const DEEPCRAWL_BASE_URL =
  process.env.DEEPCRAWL_API_URL ||
  (process.env.NEXT_PUBLIC_DEEPCRAWL_API_URL as string) ||
  'https://deepcrawl-worker-v0-production.shinzero.workers.dev';

interface DcRequestOptions {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  url: string;
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
}

async function dcRequest<T>(options: DcRequestOptions): Promise<T> {
  const { method, url, body, params } = options;

  const requestHeaders = await headers();
  const authHeaders = buildDeepcrawlHeaders(requestHeaders);

  let fullUrl = `${DEEPCRAWL_BASE_URL}${url}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.set(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      fullUrl += `?${queryString}`;
    }
  }

  const response = await fetch(fullUrl, {
    method,
    headers: {
      ...authHeaders,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `HTTP ${response.status}`);
  }

  return data;
}

export interface ScheduledJob {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  url: string;
  operation: string;
  options: Record<string, unknown> | null;
  scheduleType: string;
  scheduleValue: string;
  timezone: string;
  enableChangeDetection: boolean;
  changeDetectionMode: string;
  diffThreshold: number | null;
  notifyOnChange: boolean;
  notifyOnError: boolean;
  webhookUrl: string | null;
  notificationChannels: string[];
  isActive: boolean;
  lastRunAt: string | null;
  nextRunAt: string | null;
  runCount: number;
  errorCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface JobRun {
  id: string;
  jobId: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
  duration: number | null;
  success: boolean | null;
  responseHash: string | null;
  responseSize: number | null;
  hasChanged: boolean | null;
  changeType: string | null;
  diffPercentage: number | null;
  error: Record<string, unknown> | null;
  createdAt: string;
}

export interface JobSnapshot {
  id: string;
  jobId: string;
  runId: string;
  content: string | null;
  contentHash: string;
  metadata: Record<string, unknown> | null;
  size: number | null;
  createdAt: string;
}

export async function dcListScheduledJobs(params?: {
  limit?: number;
  offset?: number;
  isActive?: boolean;
}): Promise<{ success: boolean; data: ScheduledJob[] }> {
  return dcRequest({
    method: 'GET',
    url: '/scheduler/jobs',
    params,
  });
}

export async function dcGetScheduledJob(jobId: string): Promise<{
  success: boolean;
  data: ScheduledJob;
}> {
  return dcRequest({
    method: 'GET',
    url: `/scheduler/jobs/${jobId}`,
  });
}

export async function dcCreateScheduledJob(input: {
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
  return dcRequest({
    method: 'POST',
    url: '/scheduler/jobs',
    body: input,
  });
}

export async function dcUpdateScheduledJob(
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
  return dcRequest({
    method: 'PATCH',
    url: `/scheduler/jobs/${jobId}`,
    body: input,
  });
}

export async function dcDeleteScheduledJob(jobId: string): Promise<{
  success: boolean;
}> {
  return dcRequest({
    method: 'DELETE',
    url: `/scheduler/jobs/${jobId}`,
  });
}

export async function dcTriggerScheduledJob(jobId: string): Promise<{
  success: boolean;
  data: {
    runId: string;
    hasChanged: boolean;
    changeType: string | null;
    diffPercentage: number;
  };
}> {
  return dcRequest({
    method: 'POST',
    url: `/scheduler/jobs/${jobId}/trigger`,
  });
}

export async function dcGetJobRuns(
  jobId: string,
  params?: { limit?: number; offset?: number },
): Promise<{ success: boolean; data: JobRun[] }> {
  return dcRequest({
    method: 'GET',
    url: `/scheduler/jobs/${jobId}/runs`,
    params,
  });
}

export async function dcGetJobSnapshots(
  jobId: string,
  params?: { limit?: number },
): Promise<{ success: boolean; data: JobSnapshot[] }> {
  return dcRequest({
    method: 'GET',
    url: `/scheduler/jobs/${jobId}/snapshots`,
    params,
  });
}
