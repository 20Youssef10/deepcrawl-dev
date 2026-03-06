# DeepCrawl Dashboard

Professional web interface for managing DeepCrawl web scraping operations, API keys, usage analytics, and system configuration.

## Overview

The DeepCrawl Dashboard is a comprehensive management interface built with Next.js 16 that provides administrators and developers with full control over their DeepCrawl deployment. It offers real-time monitoring, API key management, authentication configuration, and usage analytics in a modern, responsive interface.

## Key Features

### Authentication & Access Control
- **Multi-Provider Authentication**: GitHub, Google, email/password, passkeys, and magic links
- **Role-Based Access Control**: Granular permissions for different user types
- **API Key Management**: Generate, rotate, revoke, and monitor API keys with usage tracking
- **Session Management**: View and manage active user sessions across devices
- **Security Audit Logs**: Track authentication events and access patterns

### Monitoring & Analytics
- **Real-Time Usage Dashboard**: Live API request tracking, success rates, and response times
- **Endpoint Analytics**: Breakdown of usage by tool type (read, extract, screenshot, etc.)
- **Geographic Distribution**: Request origins and performance by region
- **Error Analytics**: Detailed error tracking with categorization and trends
- **Rate Limit Monitoring**: Current usage vs. allocated quotas

### Configuration Management
- **Environment Variables**: Secure configuration of all system parameters
- **Worker Management**: Status and configuration of Cloudflare Workers
- **Database Connections**: Connection status and configuration for storage systems
- **Feature Flags**: Enable/disable experimental features safely
- **Webhook Configuration**: Set up and manage outgoing notifications

### Developer Experience
- **Integrated API Explorer**: Test endpoints directly from the dashboard
- **SDK Documentation**: Interactive documentation for client libraries
- **Environment Promotion**: Seamless movement between dev/staging/prod
- **Backup & Restore**: Configuration export/import for disaster recovery
- **Diagnostic Tools**: Built-in utilities for troubleshooting connectivity issues

## Technology Stack

### Frontend
- **Framework**: Next.js 16 (App Router with React 19)
- **Language**: TypeScript (strict mode enabled)
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query (React Query) for server state
- **Form Handling**: React Hook Form with Zod validation
- **Animations**: Framer Motion for smooth transitions
- **Icons**: Heroicons and custom SVG icon set

### Build & DevOps
- **Build System**: Turbopack (Next.js native bundler)
- **Linting**: Biome (formatter, linter, and import sorter)
- **Type Checking**: TypeScript with strict settings
- **Testing**: Vitest for unit and integration tests
- **CI/CD**: GitHub Actions with automated testing and deployment

## Getting Started

### Prerequisites
- Node.js >= 20
- pnpm >= 8
- Access to deployed DeepCrawl services (API worker, auth worker, MCP server)
- Cloudflare account (for worker management features)

### Installation
```bash
# Clone repository
git clone https://github.com/20Youssef10/deepcrawl-dev.git
cd deepcrawl-dev/apps/app

# Install dependencies
pnpm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your configuration

# Start development server
pnpm dev
# Dashboard available at: http://localhost:3000
```

### Environment Configuration
Create `.env.local` based on `.env.example`:

```env
# Application Settings
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=https://deepcrawl-worker-v0-production.shinzero.workers.dev

# Authentication (choose one)
AUTH_MODE=better-auth  # or: jwt | none

# BetterAuth Configuration (if using AUTH_MODE=better-auth)
BETTER_AUTH_SECRET=your_32_byte_secret_here
BETTER_AUTH_URL=http://localhost:3000/api/auth
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000/api/auth

# JWT Configuration (if using AUTH_MODE=jwt)
NEXT_PUBLIC_JWT_ISSUER=your_issuer_here
NEXT_PUBLIC_JWT_AUDIENCE=your_audience_here
NEXT_PUBLIC_JWT_SECRET=your_jwt_secret_here

# DeepCrawl Services
DEEPCRAWL_API_URL=https://deepcrawl-worker-v0-production.shinzero.workers.dev
DEEPCRAWL_MCP_URL=https://deepcrawl-mcp.shinzero.workers.dev/mcp
DEEPCRAWL_AUTH_URL=https://deepcrawl-worker-auth.shinzero.workers.dev

# Optional: Feature Flags
ENABLE_API_RATE_LIMIT=true
ENABLE_ACTIVITY_LOGS=true
```

## Usage Guide

### Authentication Management
1. Navigate to **Settings → Authentication**
2. Configure your preferred authentication provider(s)
3. Set up session timeout, password policies, and security settings
4. Invite team members and assign roles

### API Key Management
1. Go to **API Keys** in the sidebar navigation
2. Click **"Create API Key"** to generate a new key
3. Set key name, expiration date, and optional usage limits
4. Copy the key immediately (it won't be shown again)
5. Monitor usage in the **Analytics** dashboard

### Usage Analytics
1. Visit the **Dashboard** homepage for real-time overview
2. Explore **Analytics** section for detailed breakdowns:
   - **Requests Over Time**: Hourly/daily/weekly trends
   - **By Endpoint**: Usage distribution across tools
   - **Success Rates**: HTTP status code breakdowns
   - **Geographic Heatmap**: Request origins by country
   - **Performance Metrics**: Average response times and percentiles

### System Configuration
1. Access **Settings → Configuration** for environment variables
2. Modify worker URLs, feature flags, and integration settings
3. Use the **Connection Test** button to verify service connectivity
4. Save changes and restart workers if required

### Troubleshooting
1. Use **System Status** page to check health of all services
2. Check **Logs** section for detailed request/response metadata
3. Utilize **API Explorer** to test endpoints directly
4. Review **Error Reports** for pattern recognition and resolution

## Architecture Overview

### Component Structure
```
src/
  app/                    # Next.js 16 App Router
    api/                  # API routes (auth, proxy, etc.)
    dashboard/            # Main dashboard pages
    settings/             # Configuration and management pages
    components/           # Reusable UI components
    hooks/                # Custom React hooks
    lib/                  # Utility functions and services
    types/                # TypeScript definitions
```

### Data Flow
1. **Frontend → Next.js API Routes**: Secure communication via Next.js API routes
2. **API Routes → DeepCrawl Services**: Proxy requests to underlying services
3. **Services → Cloudflare Workers**: Direct communication with deployed workers
4. **Workers → Storage**: KV Namespaces and D1 databases for persistence
5. **Responses → Frontend**: Data returned through the same path in reverse

### Security Considerations
- **API Proxy**: Dashboard never exposes upstream service URLs to clients
- **Input Sanitization**: All user inputs validated and sanitized
- **CSRF Protection**: Next.js built-in protection enabled
- **Secure Cookies**: HttpOnly, Secure, SameSite attributes applied
- **Content Security Policy**: Strict CSP headers implemented
- **Rate Limiting**: Per-user and IP-based limiting on dashboard endpoints

## Development Commands

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Start with all workers (requires local Cloudflare setup)
pnpm dev:workers

# Run type checking
pnpm typecheck

# Run linting with auto-fix
pnpm lint

# Run tests
pnpm test

# Build for production
pnpm build

# Start production server
pnpm start

# Format code according to project standards
pnpm format
```

## Deployment

### Vercel (Recommended)
1. Connect repository to Vercel project
2. Configure environment variables in Vercel dashboard
3. Vercel automatically builds and deploys on push to main
4. Custom domains and SSL handled automatically

### Docker
```bash
# Build image
docker build -t deepcrawl-dashboard .

# Run container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_APP_URL=https://your-domain.com \
  -e DEEPCRAWL_API_URL=https://api.deepcrawl.dev \
  -e BETTER_AUTH_SECRET=your_secret \
  deepcrawl-dashboard
```

### Manual Deployment
```bash
# Build for production
pnpm build

# Start server
NODE_ENV=production pnpm start
```

## Contributing

Please read our [CONTRIBUTING.md](../CONTRIBUTING.md) for details on:
- Code review process
- Testing requirements
- Documentation standards
- Release procedures
- Community guidelines

## License

This dashboard is part of the DeepCrawl project and is licensed under the MIT License. See the [root LICENSE](../LICENSE) file for details.

## Support

- Documentation: https://deepcrawl.dev/docs/dashboard
- API Reference: https://deepcrawl.dev/docs/api
- Issues: https://github.com/20Youssef10/deepcrawl-dev/issues
- Discussions: https://github.com/20Youssef10/deepcrawl-dev/discussions
- Security Concerns: security@deepcrawl.dev

---

Built with ❤️ for the AI agent ecosystem.