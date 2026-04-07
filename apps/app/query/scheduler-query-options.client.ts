/** @client */
import { queryOptions } from '@tanstack/react-query';
import { baseQueryOptions } from './query.client';
import { userQueryKeys } from './query-keys';
import {
  getJobRunsClient,
  getJobSnapshotsClient,
  getScheduledJobClient,
  listScheduledJobsClient,
} from './scheduler-query.client';

export const listScheduledJobsQueryOptionsClient = (params?: {
  limit?: number;
  offset?: number;
  isActive?: boolean;
}) =>
  queryOptions({
    queryKey: [...userQueryKeys.scheduledJobs, params],
    queryFn: () => listScheduledJobsClient(params),
    ...baseQueryOptions,
  });

export const getScheduledJobQueryOptionsClient = (jobId: string) =>
  queryOptions({
    queryKey: [...userQueryKeys.scheduledJobs, jobId],
    queryFn: () => getScheduledJobClient(jobId),
    ...baseQueryOptions,
  });

export const getJobRunsQueryOptionsClient = (
  jobId: string,
  params?: { limit?: number; offset?: number },
) =>
  queryOptions({
    queryKey: [...userQueryKeys.scheduledJobs, jobId, 'runs', params],
    queryFn: () => getJobRunsClient(jobId, params),
    ...baseQueryOptions,
  });

export const getJobSnapshotsQueryOptionsClient = (
  jobId: string,
  params?: { limit?: number },
) =>
  queryOptions({
    queryKey: [...userQueryKeys.scheduledJobs, jobId, 'snapshots', params],
    queryFn: () => getJobSnapshotsClient(jobId, params),
    ...baseQueryOptions,
  });
