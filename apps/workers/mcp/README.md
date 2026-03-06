# DeepCrawl MCP Server

Professional Model Context Protocol (MCP) server that enables AI assistants to directly access DeepCrawl's web scraping and data extraction capabilities.

## Overview

The DeepCrawl MCP Server provides a standardized interface for AI assistants (Claude, ChatGPT, Cursor, etc.) to perform web scraping, content extraction, and data processing tasks through the Model Context Protocol. This enables seamless integration of real-time web data into AI workflows without requiring custom API implementations.

**Server Endpoint:** `https://deepcrawl-mcp.shinzero.workers.dev/mcp`

## Features

### Complete Toolset

| Tool | Description | Use Cases |
|------|-------------|-----------|
| `read_url` | Fetch any URL and return structured data including HTML, clean Markdown, and metadata | Research, content gathering, page analysis |
| `get_markdown` | Extract clean, AI-optimized Markdown from webpages | Documentation, note-taking, LLM context |
| `extract_links` | Extract hierarchical link trees (internal, external, media) | Site mapping, SEO analysis, navigation analysis |
| `take_screenshot` | Capture webpage screenshots in PNG/JPEG/WebP formats | Visual testing, UI validation, reference capture |
| `extract_elements` | Extract specific DOM elements using CSS selectors | Targeted data extraction, form analysis, element inspection |
| `json_fetch` | Fetch and parse JSON responses from APIs with custom headers/methods | REST/GraphQL API integration, data synchronization |
| `extract_pdf` | Extract text content from PDF documents hosted online | Document processing, research paper analysis, report generation |
| `batch_process` | Process multiple URLs in parallel with configurable operations | Bulk data collection, site audits, comparative analysis |
| `list_logs` | Monitor API usage, request history, and performance metrics | Usage tracking, debugging, quota management |

### Technical Advantages

- **Standardized Protocol**: MCP ensures consistent, predictable interactions
- **Structured Responses**: All tools return normalized JSON for reliable parsing
- **Error Handling**: Comprehensive error reporting with HTTP status codes
- **Performance Metrics**: Detailed timing and resource usage data included
- **Streaming Support**: Efficient handling of large responses via SSE
- **CORS Enabled**: Secure cross-origin access for web-based AI clients

## Architecture

### Technology Stack
- **Protocol**: Model Context Protocol (MCP) v1.0
- **Transport**: Streamable HTTP with Server-Sent Events (SSE)
- **Runtime**: Cloudflare Workers (global edge network)
- **Language**: TypeScript (end-to-end type safety)
- **Framework**: Hono (minimalist web framework)
- **Validation**: Zod (schema validation and type inference)
- **HTTP Client**: Native Fetch API with Cloudflare optimizations

### Security Model
- **Server-Side Authentication**: API key managed via Cloudflare Secrets
- **Client Access**: Public endpoint with no required client credentials
- **Data Privacy**: No logging of request/response content beyond metadata
- **Rate Limiting**: Inherited from underlying DeepCrawl API worker
- **Input Validation**: Strict Zod schema validation on all parameters

## Integration Examples

### Claude Desktop / Cursor Configuration
```json
{
  "mcpServers": {
    "deepcrawl": {
      "command": "npx",
      "args": ["mcp-remote", "https://deepcrawl-mcp.shinzero.workers.dev/mcp"],
      "env": {}
    }
  }
}
```

### Direct HTTP Access (for debugging)
```bash
# Initialize MCP session
curl -N http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {},
      "clientInfo": {
        "name": "test-client",
        "version": "1.0.0"
      }
    }
  }'

# List available tools
curl -N http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/list"
  }'

# Call a tool (e.g., read_url)
curl -N http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "read_url",
      "arguments": {
        "url": "https://example.com",
        "markdown": true
      }
    }
  }'
```

## Development Setup

### Prerequisites
- Node.js >= 20
- pnpm >= 8
- Cloudflare account with API token
- DeepCrawl API v0 worker deployed

### Local Development
```bash
# Install dependencies
pnpm install

# Start local development server
pnpm dev
# Available at: http://localhost:8787/mcp

# Run with inspector (for debugging)
pnpm dev:inspector
```

### Deployment
```bash
# Deploy to Cloudflare Workers
pnpm deploy
# or
npx wrangler deploy --env production
```

### Environment Configuration
Configure via Cloudflare Secrets or wrangler.toml:
```toml
[vars]
DEEPCRAWL_API_URL = "https://deepcrawl-worker-v0-production.shinzero.workers.dev"
DEEPCRAWL_API_KEY = "your_deepcrawl_api_key_here"

[compatability_flags]
nodejs_compat = true
global_fetch_strictly_public = true
```

## Response Format

All tools return a standardized MCP response structure:
```json
{
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"success\":true,\"data\":{...}}"
      }
    ]
  },
  "jsonrpc": "2.0",
  "id": "<request_id>"
}
```

Error responses follow MCP conventions:
```json
{
  "error": {
    "code": -32603,
    "message": "Failed to fetch URL: Timeout",
    "data": {
      "url": "https://example.com",
      "timestamp": "2024-01-01T00:00:00Z"
    }
  },
  "jsonrpc": "2.0",
  "id": "<request_id>"
}
```

## Rate Limits & Quotas

Inherits limits from the DeepCrawl API worker:
- **Requests per minute**: Configurable via worker settings
- **Concurrent requests**: Limited by Cloudflare Worker runtime
- **Response size**: Limited by Worker payload constraints
- **Compute time**: Subject to Cloudflare Worker CPU time limits

## Monitoring & Observability

- **Built-in Metrics**: Response times, success rates, error rates
- **Logging**: Structured request/response logging (metadata only)
- **Health Checks**: Automatic liveness and readiness probes
- **Distributed Tracing**: Compatible with OpenTelemetry via Cloudflare observability

## Contributing

See the [CONTRIBUTING.md](./CONTRIBUTING.md) file for detailed guidelines.

### Development Workflow
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Make changes and ensure tests pass
4. Commit with conventional commits (`feat: add amazing feature`)
5. Push to branch and open Pull Request
6. Maintainers will review and merge

### Code Standards
- TypeScript strict mode enabled
- Biome formatter and linter (configured in repo root)
- Conventional Commits for changelog generation
- 100% test coverage for new features
- Documentation updates required for user-facing changes

## License

Licensed under the MIT License. See the [LICENSE](../LICENSE) file for details.

## Support

- Documentation: https://deepcrawl.dev/docs/mcp
- Issues: https://github.com/20Youssef10/deepcrawl-dev/issues
- Discussions: https://github.com/20Youssef10/deepcrawl-dev/discussions
- Emergency: Security@deepcrawl.dev (for security concerns only)

---

Built with ❤️ for the AI agent ecosystem.