import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as fsSync from "node:fs";
import { ReadFileSchema } from "../../schemas/index.js";
import type { ReadFileInput } from "../../schemas/index.js";

export async function readFile(input: ReadFileInput): Promise<string> {
  const { path: filePath, lines } = ReadFileSchema.parse(input);

  const stats = await fs.stat(filePath);
  if (stats.isDirectory()) {
    throw new Error(`Path is a directory: ${filePath}`);
  }

  if (lines !== undefined && lines > 0) {
    const content = await fs.readFile(filePath, "utf-8");
    const fileLines = content.split("\n");
    return fileLines.slice(0, lines).join("\n");
  }

  const content = await fs.readFile(filePath, "utf-8");
  return content;
}

export function registerReadFile() {
  return {
    name: "read_file",
    description:
      "Read the complete contents of a file. Use 'lines' parameter to read only the first N lines.",
    inputSchema: {
      type: "object" as const,
      properties: {
        path: {
          type: "string",
          description: "The path to the file to read",
        },
        lines: {
          type: "number",
          description: "Optional: Number of lines to read from the start",
        },
      },
      required: ["path"],
    },
  };
}
