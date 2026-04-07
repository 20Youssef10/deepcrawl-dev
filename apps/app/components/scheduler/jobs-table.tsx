'use client';

import { Badge } from '@deepcrawl/ui/components/ui/badge';
import { Button } from '@deepcrawl/ui/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@deepcrawl/ui/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@deepcrawl/ui/components/ui/table';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ExternalLink, MoreHorizontal, Play, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { userQueryKeys } from '@/query/query-keys';
import {
  deleteScheduledJobClient,
  triggerScheduledJobClient,
} from '@/query/scheduler-query.client';
import type { ScheduledJob } from '@/query/scheduler-query.server';

interface JobsTableProps {
  jobs: ScheduledJob[];
}

export function JobsTable({ jobs }: JobsTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>URL</TableHead>
            <TableHead>Schedule</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Runs</TableHead>
            <TableHead>Last Run</TableHead>
            <TableHead className="w-[50px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.map((job) => (
            <JobRow job={job} key={job.id} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function JobRow({ job }: { job: ScheduledJob }) {
  const queryClient = useQueryClient();
  const [isTriggering, setIsTriggering] = useState(false);

  const triggerMutation = useMutation({
    mutationFn: () => triggerScheduledJobClient(job.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userQueryKeys.scheduledJobs });
      setIsTriggering(false);
    },
    onError: () => {
      setIsTriggering(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteScheduledJobClient(job.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userQueryKeys.scheduledJobs });
    },
  });

  const formatSchedule = () => {
    switch (job.scheduleType) {
      case 'interval':
        return `Every ${job.scheduleValue} min`;
      case 'daily':
        return `Daily at ${job.scheduleValue}`;
      case 'weekly':
        return `Weekly: ${job.scheduleValue}`;
      case 'cron':
        return `Cron: ${job.scheduleValue}`;
      default:
        return 'Manual';
    }
  };

  const formatLastRun = () => {
    if (!job.lastRunAt) {
      return 'Never';
    }
    const date = new Date(job.lastRunAt);
    return (
      date.toLocaleDateString() +
      ' ' +
      date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    );
  };

  return (
    <TableRow>
      <TableCell className="font-medium">{job.name}</TableCell>
      <TableCell>
        <a
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
          href={job.url}
          rel="noopener noreferrer"
          target="_blank"
        >
          {job.url.length > 40 ? job.url.substring(0, 40) + '...' : job.url}
          <ExternalLink className="h-3 w-3" />
        </a>
      </TableCell>
      <TableCell>{formatSchedule()}</TableCell>
      <TableCell>
        <Badge variant={job.isActive ? 'default' : 'secondary'}>
          {job.isActive ? 'Active' : 'Paused'}
        </Badge>
      </TableCell>
      <TableCell>
        <span className="text-green-500">{job.runCount}</span>
        {job.errorCount > 0 && (
          <span className="text-red-500"> / {job.errorCount}</span>
        )}
      </TableCell>
      <TableCell className="text-muted-foreground">{formatLastRun()}</TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="h-8 w-8" size="icon" variant="ghost">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              disabled={isTriggering}
              onClick={() => {
                setIsTriggering(true);
                triggerMutation.mutate();
              }}
            >
              <Play className="mr-2 h-4 w-4" />
              {isTriggering ? 'Running...' : 'Run Now'}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-500"
              onClick={() => {
                if (confirm('Are you sure you want to delete this job?')) {
                  deleteMutation.mutate();
                }
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
