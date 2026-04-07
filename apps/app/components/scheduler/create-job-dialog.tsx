'use client';

import { Button } from '@deepcrawl/ui/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@deepcrawl/ui/components/ui/dialog';
import { Input } from '@deepcrawl/ui/components/ui/input';
import { Label } from '@deepcrawl/ui/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@deepcrawl/ui/components/ui/select';
import { Switch } from '@deepcrawl/ui/components/ui/switch';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { userQueryKeys } from '@/query/query-keys';
import { createScheduledJobClient } from '@/query/scheduler-query.client';

interface CreateJobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateJobDialog({ open, onOpenChange }: CreateJobDialogProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [operation, setOperation] = useState('read');
  const [scheduleType, setScheduleType] = useState('interval');
  const [scheduleValue, setScheduleValue] = useState('60');
  const [enableChangeDetection, setEnableChangeDetection] = useState(true);
  const [changeDetectionMode, setChangeDetectionMode] =
    useState('content_hash');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const createMutation = useMutation({
    mutationFn: createScheduledJobClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userQueryKeys.scheduledJobs });
      onOpenChange(false);
      resetForm();
    },
    onError: (err: Error) => {
      setError(err.message);
      setIsSubmitting(false);
    },
  });

  const resetForm = () => {
    setName('');
    setUrl('');
    setOperation('read');
    setScheduleType('interval');
    setScheduleValue('60');
    setEnableChangeDetection(true);
    setChangeDetectionMode('content_hash');
    setWebhookUrl('');
    setError('');
    setIsSubmitting(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    createMutation.mutate({
      name,
      url,
      operation,
      scheduleType,
      scheduleValue,
      enableChangeDetection,
      changeDetectionMode,
      webhookUrl: webhookUrl || undefined,
    });
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Scheduled Job</DialogTitle>
          <DialogDescription>
            Set up a recurring job to monitor websites for changes.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="name">Job Name</Label>
            <Input
              id="name"
              onChange={(e) => setName(e.target.value)}
              placeholder="My Website Monitor"
              required
              value={name}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">Website URL</Label>
            <Input
              id="url"
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              required
              type="url"
              value={url}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="operation">Operation</Label>
              <Select onValueChange={setOperation} value={operation}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="read">Read</SelectItem>
                  <SelectItem value="markdown">Markdown</SelectItem>
                  <SelectItem value="extract">Extract</SelectItem>
                  <SelectItem value="links">Links</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduleType">Schedule</Label>
              <Select onValueChange={setScheduleType} value={scheduleType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="interval">Interval</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="cron">Cron</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {scheduleType !== 'manual' && (
            <div className="space-y-2">
              <Label htmlFor="scheduleValue">
                {scheduleType === 'interval'
                  ? 'Interval (minutes)'
                  : scheduleType === 'daily'
                    ? 'Time (HH:MM)'
                    : scheduleType === 'weekly'
                      ? 'Day & Time'
                      : 'Cron Expression'}
              </Label>
              <Input
                id="scheduleValue"
                onChange={(e) => setScheduleValue(e.target.value)}
                placeholder={scheduleType === 'interval' ? '60' : '09:00'}
                value={scheduleValue}
              />
            </div>
          )}

          <div className="flex items-center justify-between space-y-2">
            <div className="space-y-1">
              <Label htmlFor="changeDetection">Change Detection</Label>
              <p className="text-muted-foreground text-xs">
                Detect and notify on content changes
              </p>
            </div>
            <Switch
              checked={enableChangeDetection}
              id="changeDetection"
              onCheckedChange={setEnableChangeDetection}
            />
          </div>

          {enableChangeDetection && (
            <div className="space-y-2">
              <Label htmlFor="changeDetectionMode">Detection Mode</Label>
              <Select
                onValueChange={setChangeDetectionMode}
                value={changeDetectionMode}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="content_hash">Content Hash</SelectItem>
                  <SelectItem value="diff">Diff</SelectItem>
                  <SelectItem value="metadata">Metadata</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="webhookUrl">Webhook URL (optional)</Label>
            <Input
              id="webhookUrl"
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://your-server.com/webhook"
              type="url"
              value={webhookUrl}
            />
            <p className="text-muted-foreground text-xs">
              Receive notifications when changes are detected
            </p>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <DialogFooter>
            <Button
              onClick={() => onOpenChange(false)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button disabled={isSubmitting} type="submit">
              {isSubmitting ? 'Creating...' : 'Create Job'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
