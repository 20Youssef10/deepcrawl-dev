import type {
  BatchOptions,
  BatchResponse,
  BatchResultSchema,
} from '@deepcrawl/types';
import type { ORPCContext } from '@/lib/context';
import { processLinksRequest } from '@/routers/links/links.processor';
import { processReadRequest } from '@/routers/read/read.processor';

export async function processBatchRequest(
  c: ORPCContext,
  options: BatchOptions,
): Promise<BatchResponse> {
  const { items, parallel = true, maxConcurrency = 5 } = options;
  const startTime = Date.now();
  const requestId = crypto.randomUUID();

  const results: any[] = [];

  const processItem = async (item: any) => {
    const itemStartTime = Date.now();
    try {
      let data: any;

      if (item.operation.type === 'read') {
        data = await processReadRequest(c, {
          url: item.url,
          ...(item.operation.options || {}),
        });
      } else if (item.operation.type === 'links') {
        data = await processLinksRequest(
          c,
          {
            url: item.url,
            ...(item.operation.options || {}),
          },
          false,
        );
      }

      return {
        id: item.id,
        url: item.url,
        success: true,
        data,
        durationMs: Date.now() - itemStartTime,
      };
    } catch (error) {
      return {
        id: item.id,
        url: item.url,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        durationMs: Date.now() - itemStartTime,
      };
    }
  };

  if (parallel) {
    const chunks = [];
    for (let i = 0; i < items.length; i += maxConcurrency) {
      chunks.push(items.slice(i, i + maxConcurrency));
    }

    for (const chunk of chunks) {
      const chunkResults = await Promise.all(chunk.map(processItem));
      results.push(...chunkResults);
    }
  } else {
    for (const item of items) {
      const result = await processItem(item);
      results.push(result);
    }
  }

  const endTime = Date.now();
  const successfulItems = results.filter((r) => r.success).length;
  const failedItems = results.filter((r) => !r.success).length;

  return {
    success: true,
    requestId,
    timestamp: new Date().toISOString(),
    metrics: {
      readableDuration: `${(endTime - startTime) / 1000}s`,
      durationMs: endTime - startTime,
      startTimeMs: startTime,
      endTimeMs: endTime,
      totalItems: items.length,
      successfulItems,
      failedItems,
    },
    results: results.map((r) => ({
      id: r.id,
      url: r.url,
      success: r.success,
      data: r.data,
      error: r.error,
      durationMs: r.durationMs,
    })),
  };
}
