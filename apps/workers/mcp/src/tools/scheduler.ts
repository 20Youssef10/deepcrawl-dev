import type {
  CreateScheduledJobInput,
  ListScheduledJobsInput,
  TriggerJobInput,
} from '@deepcrawl/types/routers/scheduler/types';

const API_URL = 'https://deepcrawl-worker-v0-production.shinzero.workers.dev';

export async function createScheduledJobTool(
  apiUrl: string,
  apiKey: string,
  input: CreateScheduledJobInput,
) {
  const response = await fetch(`${apiUrl}/scheduler/jobs`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create scheduled job');
  }

  return response.json();
}

export async function listScheduledJobsTool(
  apiUrl: string,
  apiKey: string,
  input?: ListScheduledJobsInput,
) {
  const params = new URLSearchParams();
  if (input?.limit) {
    params.set('limit', input.limit.toString());
  }
  if (input?.offset) {
    params.set('offset', input.offset.toString());
  }
  if (input?.isActive !== undefined) {
    params.set('isActive', input.isActive.toString());
  }

  const response = await fetch(`${apiUrl}/scheduler/jobs?${params}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to list scheduled jobs');
  }

  return response.json();
}

export async function getScheduledJobTool(
  apiUrl: string,
  apiKey: string,
  jobId: string,
) {
  const response = await fetch(`${apiUrl}/scheduler/jobs/${jobId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get scheduled job');
  }

  return response.json();
}

export async function updateScheduledJobTool(
  apiUrl: string,
  apiKey: string,
  jobId: string,
  input: Partial<CreateScheduledJobInput>,
) {
  const response = await fetch(`${apiUrl}/scheduler/jobs/${jobId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update scheduled job');
  }

  return response.json();
}

export async function deleteScheduledJobTool(
  apiUrl: string,
  apiKey: string,
  jobId: string,
) {
  const response = await fetch(`${apiUrl}/scheduler/jobs/${jobId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete scheduled job');
  }

  return response.json();
}

export async function triggerScheduledJobTool(
  apiUrl: string,
  apiKey: string,
  jobId: string,
) {
  const response = await fetch(`${apiUrl}/scheduler/jobs/${jobId}/trigger`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to trigger scheduled job');
  }

  return response.json();
}

export async function getJobRunsTool(
  apiUrl: string,
  apiKey: string,
  jobId: string,
  limit?: number,
  offset?: number,
) {
  const params = new URLSearchParams();
  if (limit) {
    params.set('limit', limit.toString());
  }
  if (offset) {
    params.set('offset', offset.toString());
  }

  const response = await fetch(
    `${apiUrl}/scheduler/jobs/${jobId}/runs?${params}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get job runs');
  }

  return response.json();
}

export async function getJobSnapshotsTool(
  apiUrl: string,
  apiKey: string,
  jobId: string,
  limit?: number,
) {
  const params = new URLSearchParams();
  if (limit) {
    params.set('limit', limit.toString());
  }

  const response = await fetch(
    `${apiUrl}/scheduler/jobs/${jobId}/snapshots?${params}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get job snapshots');
  }

  return response.json();
}
