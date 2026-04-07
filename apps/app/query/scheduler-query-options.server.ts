/** @server */
import { queryOptions } from '@tanstack/react-query';
import { baseQueryOptions } from './query.client';
import { userQueryKeys } from './query-keys';
import {
  dcGetJobRuns,
  dcGetJobSnapshots,
  dcGetScheduledJob,
  dcListScheduledJobs,
} from './scheduler-query.server';

export const listScheduledJobsQueryOptions = (params?: {
  limit?: number;
  offset?: number;
  isActive?: boolean;
}) =>
  queryOptions({
    queryKey: [...userQueryKeys.scheduledJobs, params],
    queryFn: () => dcListScheduledJobs(params),
    ...baseQueryOptions,
  });

export const getScheduledJobQueryOptions = (jobId: string) =>
  queryOptions({
    queryKey: [...userQueryKeys.scheduledJobs, jobId],
    queryFn: () => dcGetScheduledJob(jobId),
    ...baseQueryOptions,
  });

export const getJobRunsQueryOptions = (
  jobId: string,
  params?: { limit?: number; offset?: number },
) =>
  queryOptions({
    queryKey: [...userQueryKeys.scheduledJobs, jobId, 'runs', params],
    queryFn: () => dcGetJobRuns(jobId, params),
    ...baseQueryOptions,
  });

export const getJobSnapshotsQueryOptions = (
  jobId: string,
  params?: { limit?: number },
) =>
  queryOptions({
    queryKey: [...userQueryKeys.scheduledJobs, jobId, 'snapshots', params],
    queryFn: () => dcGetJobSnapshots(jobId, params),
    ...baseQueryOptions,
  });
