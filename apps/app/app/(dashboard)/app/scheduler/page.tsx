import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { Suspense } from 'react';
import {
  SchedulerPageClient,
  SchedulerPageSkeleton,
} from '@/components/scheduler/scheduler-page-client';
import { getQueryClient } from '@/query/query.client';
import { listScheduledJobsQueryOptions } from '@/query/scheduler-query-options.server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'default-no-store';

export default async function SchedulerPage() {
  const queryClient = getQueryClient();

  try {
    await queryClient.prefetchQuery(
      listScheduledJobsQueryOptions({ limit: 50 }),
    );
  } catch (error) {
    console.error('[SchedulerPage] Prefetch failed:', error);
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<SchedulerPageSkeleton />}>
        <SchedulerPageClient />
      </Suspense>
    </HydrationBoundary>
  );
}
