# DeepCrawl

Professional web scraping and data extraction platform optimized for AI agents and LLMs.

## Overview

DeepCrawl is a high-performance web scraping platform designed specifically for AI agent workflows. It extracts clean, structured data from websites including Markdown content, hierarchical link trees, and metadata—all optimized for minimal token consumption and reduced hallucination in LLM applications.

## Features

### Core Capabilities
- **Clean Markdown Extraction**: Convert any webpage to AI-optimized Markdown
- **Structured Data**: Extract metadata, titles, and hierarchical link structures
- **JavaScript Rendering**: Full browser support for dynamic content
- **CSS Selector Extraction**: Target specific DOM elements with precision
- **JSON API Support**: Fetch and parse REST/GraphQL APIs
- **PDF Text Extraction**: Extract text content from PDF documents
- **Screenshot Generation**: Capture visual snapshots of webpages
- **Batch Processing**: Efficiently process multiple URLs in parallel

### AI-Focused Design
- **Low Token Output**: Structured responses minimize LLM context usage
- **Hallucination Reduction**: Grounded data extraction from actual web content
- **Agent-Optimized**: Designed for seamless integration with AI assistants
- **Structured Responses**: Consistent JSON format for reliable parsing

## Architecture

### Monorepo Structure
```
apps/
  app/              # Next.js dashboard
  workers/          # Cloudflare Workers
    auth/           # Authentication service
    v0/             # Main API worker
    mcp/            # Model Context Protocol server
packages/
  contracts/        # API type definitions
  db/               # Database abstractions
  sdks/             # Client SDKs (JS/TS)
  types/            # Shared TypeScript types
  ui/               # Shared UI components
  typescript-config/ # TS configuration
  eslint-config/    # Linting rules
```

### Technology Stack
- **Runtime**: Cloudflare Workers (global edge network)
- **Framework**: Hono (lightweight web framework)
- **Language**: TypeScript (end-to-end type safety)
- **Storage**: KV Namespaces + D1 (SQLite) databases
- **Browser**: Puppeteer for JavaScript rendering
- **Protocol**: Model Context Protocol (MCP) for AI integration
- **ORM**: Prisma/Drizzle for database operations

## Getting Started

### Prerequisites
- Node.js >= 20
- pnpm >= 8
- Cloudflare account (for deployment)
- Git

### Installation
```bash
# Clone repository
git clone https://github.com/20Youssef10/deepcrawl-dev.git
cd deepcrawl-dev

# Install dependencies
pnpm install

# Configure environment variables
cp .env.example .env.local
# Add your API keys and configuration

# Development
pnpm dev           # Start all services
pnpm -C apps/app dev    # Dashboard only
pnpm -C apps/app dev:workers  # Dashboard + workers
```

### Deployment
```bash
# Deploy API workers
pnpm -C apps/workers/v0 deploy
pnpm -C apps/workers/auth deploy

# Deploy MCP server
pnpm -C apps/workers/mcp deploy

# Deploy dashboard
pnpm -C apps/app deploy
```

## Usage Examples

### Via MCP Server (Recommended for AI Agents)
The MCP server provides direct access to all DeepCrawl capabilities for AI assistants:

```javascript
// Example: Claude Desktop configuration
{
  "mcpServers": {
    "deepcrawl": {
      "command": "npx",
      "args": ["mcp-remote", "https://deepcrawl-mcp.shinzero.workers.dev/mcp"]
    }
  }
}
```

### Direct API Calls
```bash
# Extract clean markdown
curl -X POST https://api.deepcrawl.dev/markdown \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}'

# Take a screenshot
curl -X POST https://api.deepcrawl.dev/screenshot \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com","format":"png","fullPage":true}'

# Batch process URLs
curl -X POST https://api.deepcrawl.dev/batch \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"url":"https://example.com","operation":{"type":"read"}},
      {"url":"https://example.org","operation":{"type":"links"}}
    ]
  }'
```

## Documentation

- [Quick Start Guide](docs/quick-start.md)
- [API Reference](docs/api-reference.md)
- [MCP Integration Guide](docs/mcp-integration.md)
- [Deployment Guide](docs/deployment.md)
- [SDK Usage](docs/sdk-usage.md)

## Environment Configuration

Create `.env.local` based on `.env.example`:

```env
# API Configuration
DEEPCRAWL_API_KEY=your_api_key_here
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Cloudflare Workers
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_api_token

# Database (if using D1)
DB_V0_ID=your_database_id

# Authentication (optional)
GITHUB_CLIENT_ID=your_github_oauth_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_client_secret
```

## Development Commands

```bash
# Install dependencies
pnpm install

# Start development environment
pnpm dev

# Run tests
pnpm test

# Run type checking
pnpm typecheck

# Run linting
pnpm lint

# Build for production
pnpm build

# Format code
pnpm format
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details on:

- Code style and conventions
- Pull request process
- Running tests
- Documentation standards

## License

DeepCrawl is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- Documentation: https://deepcrawl.dev/docs
- Issues: https://github.com/20Youssef10/deepcrawl-dev/issues
- Discussions: https://github.com/20Youssef10/deepcrawl-dev/discussions

---

Built with ❤️ for the AI agent ecosystem.