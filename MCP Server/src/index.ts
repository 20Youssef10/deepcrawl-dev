import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import http from "node:http";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import {
  readFile,
  writeFile,
  deleteFile,
  createDirectory,
  deleteDirectory,
  listDirectory,
  move,
  getMetadata,
  searchFiles,
} from "./tools/filesystem/index.js";

import { executeCommand } from "./tools/shell/index.js";

const PORT = parseInt(process.env.PORT || "3000", 10);

const server = new Server(
  {
    name: "workspace-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

const toolsList = {
  tools: [
    {
      name: "read_file",
      description: "Read the complete contents of a file.",
      inputSchema: {
        type: "object",
        properties: {
          path: { type: "string", description: "The path to the file to read" },
          lines: {
            type: "number",
            description: "Optional: Number of lines to read from the start",
          },
        },
        required: ["path"],
      },
    },
    {
      name: "write_file",
      description: "Create a new file or overwrite an existing file.",
      inputSchema: {
        type: "object",
        properties: {
          path: { type: "string", description: "The path to the file to write" },
          content: { type: "string", description: "The content to write" },
        },
        required: ["path", "content"],
      },
    },
    {
      name: "delete_file",
      description: "Delete a file from the filesystem.",
      inputSchema: {
        type: "object",
        properties: {
          path: { type: "string", description: "The path to the file to delete" },
        },
        required: ["path"],
      },
    },
    {
      name: "create_directory",
      description: "Create a new directory.",
      inputSchema: {
        type: "object",
        properties: {
          path: { type: "string", description: "The path to the directory to create" },
        },
        required: ["path"],
      },
    },
    {
      name: "delete_directory",
      description: "Delete a directory from the filesystem.",
      inputSchema: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "The path to the directory to delete",
          },
          recursive: {
            type: "boolean",
            description: "Delete recursively (including all contents)",
          },
        },
        required: ["path"],
      },
    },
    {
      name: "list_directory",
      description: "List all files and directories in a directory.",
      inputSchema: {
        type: "object",
        properties: {
          path: { type: "string", description: "The path to the directory to list" },
        },
        required: ["path"],
      },
    },
    {
      name: "move",
      description: "Move or rename a file or directory.",
      inputSchema: {
        type: "object",
        properties: {
          from: { type: "string", description: "The source path" },
          to: { type: "string", description: "The destination path" },
        },
        required: ["from", "to"],
      },
    },
    {
      name: "get_metadata",
      description: "Get metadata about a file or directory.",
      inputSchema: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "The path to the file or directory",
          },
        },
        required: ["path"],
      },
    },
    {
      name: "search_files",
      description: "Search for files matching a glob pattern.",
      inputSchema: {
        type: "object",
        properties: {
          path: { type: "string", description: "The directory to search in" },
          pattern: {
            type: "string",
            description: "The glob pattern to match (e.g., '*.ts', '**/*.js')",
          },
        },
        required: ["path", "pattern"],
      },
    },
    {
      name: "execute_command",
      description: "Execute a shell command and return the output.",
      inputSchema: {
        type: "object",
        properties: {
          command: { type: "string", description: "The shell command to execute" },
          cwd: {
            type: "string",
            description: "Optional: The working directory to execute the command in",
          },
          timeout: {
            type: "number",
            description:
              "Optional: Timeout in milliseconds (default: 300000 = 5 minutes)",
          },
        },
        required: ["command"],
      },
    },
  ],
};

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return toolsList;
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "read_file": {
        const content = await readFile(args as { path: string; lines?: number });
        return { content: [{ type: "text", text: content }] };
      }
      case "write_file": {
        const result = await writeFile(args as { path: string; content: string });
        return { content: [{ type: "text", text: result }] };
      }
      case "delete_file": {
        const result = await deleteFile(args as { path: string });
        return { content: [{ type: "text", text: result }] };
      }
      case "create_directory": {
        const result = await createDirectory(args as { path: string });
        return { content: [{ type: "text", text: result }] };
      }
      case "delete_directory": {
        const result = await deleteDirectory(
          args as { path: string; recursive?: boolean },
        );
        return { content: [{ type: "text", text: result }] };
      }
      case "list_directory": {
        const entries = await listDirectory(args as { path: string });
        const formatted = entries
          .map(
            (e) =>
              `${e.isDirectory ? "[DIR]" : "[FILE]"} ${e.name}${
                e.isFile ? ` (${e.size} bytes)` : ""
              }`,
          )
          .join("\n");
        return { content: [{ type: "text", text: formatted || "(empty)" }] };
      }
      case "move": {
        const result = await move(args as { from: string; to: string });
        return { content: [{ type: "text", text: result }] };
      }
      case "get_metadata": {
        const metadata = await getMetadata(args as { path: string });
        const formatted = [
          `Name: ${metadata.name}`,
          `Path: ${metadata.path}`,
          `Type: ${metadata.isDirectory ? "Directory" : "File"}`,
          `Size: ${metadata.size} bytes`,
          `Created: ${metadata.created}`,
          `Modified: ${metadata.modified}`,
          `Accessed: ${metadata.accessed}`,
        ].join("\n");
        return { content: [{ type: "text", text: formatted }] };
      }
      case "search_files": {
        const files = await searchFiles(args as { path: string; pattern: string });
        const formatted = files.map((f) => f.path).join("\n");
        return { content: [{ type: "text", text: formatted || "No matches found" }] };
      }
      case "execute_command": {
        const result = await executeCommand(
          args as { command: string; cwd?: string; timeout?: number },
        );
        const output = [
          `Exit Code: ${result.exitCode}`,
          `Duration: ${result.duration}ms`,
          result.timedOut ? "Timed Out: true" : "",
          result.stdout ? `\n--- STDOUT ---\n${result.stdout}` : "",
          result.stderr ? `\n--- STDERR ---\n${result.stderr}` : "",
        ]
          .filter(Boolean)
          .join("\n");
        return {
          content: [{ type: "text", text: output }],
          isError: result.exitCode !== 0,
        };
      }
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

async function handleToolCall(name: string, args: unknown) {
  switch (name) {
    case "read_file": {
      const content = await readFile(args as { path: string; lines?: number });
      return { content: [{ type: "text", text: content }] };
    }
    case "write_file": {
      const result = await writeFile(args as { path: string; content: string });
      return { content: [{ type: "text", text: result }] };
    }
    case "delete_file": {
      const result = await deleteFile(args as { path: string });
      return { content: [{ type: "text", text: result }] };
    }
    case "create_directory": {
      const result = await createDirectory(args as { path: string });
      return { content: [{ type: "text", text: result }] };
    }
    case "delete_directory": {
      const result = await deleteDirectory(
        args as { path: string; recursive?: boolean },
      );
      return { content: [{ type: "text", text: result }] };
    }
    case "list_directory": {
      const entries = await listDirectory(args as { path: string });
      const formatted = entries
        .map(
          (e) =>
            `${e.isDirectory ? "[DIR]" : "[FILE]"} ${e.name}${
              e.isFile ? ` (${e.size} bytes)` : ""
            }`,
        )
        .join("\n");
      return { content: [{ type: "text", text: formatted || "(empty)" }] };
    }
    case "move": {
      const result = await move(args as { from: string; to: string });
      return { content: [{ type: "text", text: result }] };
    }
    case "get_metadata": {
      const metadata = await getMetadata(args as { path: string });
      const formatted = [
        `Name: ${metadata.name}`,
        `Path: ${metadata.path}`,
        `Type: ${metadata.isDirectory ? "Directory" : "File"}`,
        `Size: ${metadata.size} bytes`,
        `Created: ${metadata.created}`,
        `Modified: ${metadata.modified}`,
        `Accessed: ${metadata.accessed}`,
      ].join("\n");
      return { content: [{ type: "text", text: formatted }] };
    }
    case "search_files": {
      const files = await searchFiles(args as { path: string; pattern: string });
      const formatted = files.map((f) => f.path).join("\n");
      return { content: [{ type: "text", text: formatted || "No matches found" }] };
    }
    case "execute_command": {
      const result = await executeCommand(
        args as { command: string; cwd?: string; timeout?: number },
      );
      const output = [
        `Exit Code: ${result.exitCode}`,
        `Duration: ${result.duration}ms`,
        result.timedOut ? "Timed Out: true" : "",
        result.stdout ? `\n--- STDOUT ---\n${result.stdout}` : "",
        result.stderr ? `\n--- STDERR ---\n${result.stderr}` : "",
      ]
        .filter(Boolean)
        .join("\n");
      return {
        content: [{ type: "text", text: output }],
        isError: result.exitCode !== 0,
      };
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function handleJsonRpc(json: unknown): Promise<unknown> {
  const request = json as {
    jsonrpc?: string;
    id?: string | number;
    method?: string;
    params?: unknown;
  };

  if (request.method === "initialize") {
    return {
      jsonrpc: "2.0",
      id: request.id,
      result: {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: { name: "workspace-mcp", version: "1.0.0" },
      },
    };
  }

  if (request.method === "tools/list") {
    return { jsonrpc: "2.0", id: request.id, result: toolsList };
  }

  if (request.method === "tools/call") {
    const params = request.params as { name: string; arguments: Record<string, unknown> };
    try {
      const result = await handleToolCall(params.name, params.arguments);
      return { jsonrpc: "2.0", id: request.id, result };
    } catch (error) {
      return {
        jsonrpc: "2.0",
        id: request.id,
        error: {
          code: -32603,
          message: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  return {
    jsonrpc: "2.0",
    id: request.id,
    error: { code: -32601, message: "Method not found" },
  };
}

async function startHttpServer() {
  const server_http = http.createServer(async (req, res) => {
    if (req.url === "/mcp" || req.url?.startsWith("/mcp")) {
      let body = "";
      req.on("data", (chunk) => (body += chunk));
      req.on("end", async () => {
        try {
          const json = JSON.parse(body);
          const response = await handleJsonRpc(json);
          res.writeHead(200, {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          });
          res.end(JSON.stringify(response));
        } catch (e) {
          console.error("Error handling request:", e);
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Internal error" }));
        }
      });
    } else if (req.url === "/sse") {
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
      });
      res.write("\n");
    } else if (req.url === "/") {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("MCP Workspace Server - POST to /mcp");
    } else {
      res.statusCode = 404;
      res.end("Not found");
    }
  });

  server_http.listen(PORT, () => {
    console.log(`HTTP MCP server running on http://localhost:${PORT}`);
    console.log(`Endpoints:`);
    console.log(`  POST /mcp - JSON-RPC endpoint`);
    console.log(`  GET  /sse - SSE endpoint`);
    console.log(`\nUse cloudflared tunnel to expose to the internet:`);
    console.log(`  cloudflared tunnel --url http://localhost:${PORT}`);
  });
}

async function startStdioServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.log("MCP workspace server started (stdio mode)");
}

const isHttpMode = process.argv.includes("--http");

if (isHttpMode) {
  startHttpServer();
} else {
  startStdioServer();
}
