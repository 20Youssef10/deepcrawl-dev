# MCP Workspace Server

MCP server for workspace filesystem and shell execution with HTTP transport.

## Usage

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Run locally
pnpm start

# Run with cloudflared tunnel
pnpm tunnel
```

## Environment Variables

- `PORT` - Server port (default: 3000)

## MCP Tools

### Filesystem Tools
- `read_file` - Read file contents
- `write_file` - Write content to file
- `delete_file` - Delete a file
- `create_directory` - Create a directory
- `delete_directory` - Delete a directory
- `list_directory` - List directory contents
- `move` - Move file/directory
- `get_metadata` - Get file metadata
- `search_files` - Search files by pattern

### Shell Tools
- `execute_command` - Execute shell command

## Configuration

### Claude Desktop (stdio)
```json
{
  "mcpServers": {
    "workspace": {
      "command": "node",
      "args": ["/path/to/MCP Server/dist/index.js"]
    }
  }
}
```

### Remote (HTTP)
```json
{
  "mcpServers": {
    "workspace": {
      "type": "http",
      "url": "https://your-tunnel-url.com/mcp"
    }
  }
}
```
