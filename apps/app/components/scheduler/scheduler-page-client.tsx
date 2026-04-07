'use client';

import { Button } from '@deepcrawl/ui/components/ui/button';
import { Card, CardContent } from '@deepcrawl/ui/components/ui/card';
import { Skeleton } from '@deepcrawl/ui/components/ui/skeleton';
import { cn } from '@deepcrawl/ui/lib/utils';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { listScheduledJobsQueryOptionsClient } from '@/query/scheduler-query-options.client';
import { PageContainer, PageHeader } from '../page-elements';
import { CreateJobDialog } from './create-job-dialog';
import { JobsTable } from './jobs-table';

function SchedulerPageDescription({ className }: { className?: string }) {
  return (
    <p className={cn('text-muted-foreground text-xs md:text-sm', className)}>
      Schedule recurring web crawling jobs with automatic change detection and
      webhook notifications.
    </p>
  );
}

export function SchedulerPageSkeleton() {
  return (
    <>
      <PageHeader
        description="Manage your scheduled crawling jobs."
        title="Scheduled Jobs"
      />
      <PageContainer>
        <SchedulerPageDescription />
        <div className="mt-4 space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </PageContainer>
    </>
  );
}

export function SchedulerPageClient() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const { data } = useSuspenseQuery(
    listScheduledJobsQueryOptionsClient({ limit: 50 }),
  );

  const jobs = data?.data || [];

  return (
    <>
      <PageHeader
        description="Schedule recurring web crawling jobs with automatic change detection and webhook notifications."
        title="Scheduled Jobs"
      >
        <Button onClick={() => setShowCreateDialog(true)}>New Job</Button>
      </PageHeader>
      <PageContainer>
        {jobs.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="mb-4 text-muted-foreground">
                No scheduled jobs yet. Create your first job to start monitoring
                websites.
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                Create First Job
              </Button>
            </CardContent>
          </Card>
        ) : (
          <JobsTable jobs={jobs} />
        )}

        <CreateJobDialog
          onOpenChange={setShowCreateDialog}
          open={showCreateDialog}
        />
      </PageContainer>
    </>
  );
}
