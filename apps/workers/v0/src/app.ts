import { resolveBrandConfigFromEnv } from '@deepcrawl/runtime';
import { getRuntimeKey } from 'hono/adapter';
import { getConnInfo } from 'hono/cloudflare-workers';
import { createContext } from '@/lib/context';
import createHonoApp from '@/lib/hono/create-hono-app';
import { openAPIHandler } from '@/lib/openapi/openapi.handler';
import { rpcHandler } from '@/lib/orpc/rpc.handler';
import { processBatchRequest } from '@/routers/batch/batch.processor';
import { processJsonRequest } from '@/routers/json/json.processor';
import { processPdfRequest } from '@/routers/pdf/pdf.processor';
import schedulerRouter from '@/routers/scheduler';

// Preload heavy modules during worker initialization to reduce cold start time
import '@/services/scrape/scrape.service';
import '@/services/link/link.service';
import '@/services/html-cleaning/html-cleaning.service';
import 'cheerio';
import '@paoramen/cheer-reader';

export const EPHEMERAL_CACHE = new Map();

const app = createHonoApp();

// JSON endpoint
app.post('/json', async (c) => {
  const context = await createContext({ context: c });
  const input = await c.req.json();
  const result = await processJsonRequest(context, input);
  return c.json(result);
});

// PDF endpoint
app.post('/pdf', async (c) => {
  const context = await createContext({ context: c });
  const input = await c.req.json();
  const result = await processPdfRequest(context, input);
  return c.json(result);
});

// Batch endpoint
app.post('/batch', async (c) => {
  const context = await createContext({ context: c });
  const input = await c.req.json();
  const result = await processBatchRequest(context, input);
  return c.json(result);
});

// Scheduler endpoints
app.route('/scheduler', schedulerRouter);

// Health check endpoint
app.get('/health', async (c) => {
  const start = Date.now();

  // Check D1 database
  let dbStatus = 'unknown';
  try {
    const db = c.env.DB_V0;
    if (db) {
      await db.prepare('SELECT 1').first();
      dbStatus = 'healthy';
    } else {
      dbStatus = 'not configured';
    }
  } catch (e) {
    dbStatus = 'unhealthy';
  }

  // Check KV stores
  const kvStatus = {
    links: 'unknown',
    read: 'unknown',
  };
  try {
    await c.env.DEEPCRAWL_V0_LINKS_STORE.get('health-check');
    kvStatus.links = 'healthy';
  } catch {
    kvStatus.links = 'unhealthy';
  }
  try {
    await c.env.DEEPCRAWL_V0_READ_STORE.get('health-check');
    kvStatus.read = 'healthy';
  } catch {
    kvStatus.read = 'unhealthy';
  }

  const responseTime = Date.now() - start;

  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime?.() || 'unknown',
    responseTimeMs: responseTime,
    services: {
      database: dbStatus,
      kvLinksStore: kvStatus.links,
      kvReadStore: kvStatus.read,
    },
    version: '1.0.0',
  });
});

// Health check (simple)
app.get('/healthz', (c) => {
  return c.text('OK');
});

// Index & Health check (debug/info)
app.get('/', async (c) => {
  const brand = resolveBrandConfigFromEnv(c.env);
  const info = getConnInfo(c);
  const apiOrigin = new URL(c.req.url).origin;

  // Get KV stats
  const kvStats = { links: 'unknown', read: 'unknown' };
  try {
    await c.env.DEEPCRAWL_V0_LINKS_STORE.list({ limit: 1 });
    kvStats.links = 'configured';
  } catch {
    kvStats.links = 'error';
  }

  try {
    await c.env.DEEPCRAWL_V0_READ_STORE.list({ limit: 1 });
    kvStats.read = 'configured';
  } catch {
    kvStats.read = 'error';
  }

  try {
    const readList = await c.env.DEEPCRAWL_V0_READ_STORE.list({ limit: 1 });
    kvStats.read = readList.keys.length >= 0 ? 'configured' : 'empty';
  } catch {
    kvStats.read = 'error';
  }

  return c.json({
    message: `Welcome to ${brand.name} API`,
    brand,
    runtime: getRuntimeKey(),
    nodeEnv: c.env.WORKER_NODE_ENV,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    routes: {
      health: '/health',
      healthz: '/healthz',
      docs: '/docs',
      openapi: '/openapi',
      read: '/read?=url',
      links: '/links?=url',
      logs: '/logs?id=requestId',
      site: apiOrigin,
    },
    services: {
      kvStore: kvStats,
      d1Database: c.env.DB_V0 ? 'configured' : 'not configured',
      authWorker: c.env.AUTH_WORKER ? 'configured' : 'not configured',
    },
    authentication: c.var.session?.user
      ? { ...c.var.session }
      : 'disabled (AUTH_MODE=none)',
  });
});

// Handle RPC routes first (more specific)
app.use('/rpc/*', async (c, next) => {
  const context = await createContext({ context: c });
  const { matched, response } = await rpcHandler.handle(c.req.raw, {
    prefix: '/rpc',
    context,
  });

  if (matched) {
    return c.newResponse(response.body, response);
  }

  await next();
});

// Handle all other routes with OpenAPI handler
app.all('*', async (c) => {
  const context = await createContext({ context: c });
  const { matched, response } = await openAPIHandler.handle(c.req.raw, {
    context,
  });

  if (matched && response) {
    return c.newResponse(response.body, response);
  }

  return c.text('Not Found', 404);
});

// @deprecated old workaround approach
// Handle API routes - all routes from contract
// const routes = [
//   { path: '/docs', methods: ['GET'] },
//   { path: '/openapi', methods: ['GET'] },
//   { path: '/read', methods: ['GET', 'POST', 'OPTIONS'] },
//   { path: '/links', methods: ['GET', 'POST', 'OPTIONS'] },
//   { path: '/logs', methods: ['POST', 'OPTIONS'] },
//   { path: '/logs/:id', methods: ['GET', 'OPTIONS'] },
// ] as const;

// for (const route of routes) {
//   for (const method of route.methods) {
//     app.on(method, route.path, async (c) => {
//       const context = await createContext({ context: c });
//       const { matched, response } = await openAPIHandler.handle(c.req.raw, {
//         context,
//       });

//       if (matched && response) {
//         return c.newResponse(response.body, response);
//       }
//     });
//   }
// }

export default app;
