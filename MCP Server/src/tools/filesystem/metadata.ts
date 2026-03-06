import * as fs from "node:fs/promises";
import { GetMetadataSchema } from "../../schemas/index.js";
import type { GetMetadataInput } from "../../schemas/index.js";

export async function getMetadata(input: GetMetadataInput): Promise<{
  name: string;
  path: string;
  isDirectory: boolean;
  isFile: boolean;
  size: number;
  created: string;
  modified: string;
  accessed: string;
}> {
  const { path: filePath } = GetMetadataSchema.parse(input);

  const stats = await fs.stat(filePath);

  return {
    name: filePath.split("/").pop() || filePath,
    path: filePath,
    isDirectory: stats.isDirectory(),
    isFile: stats.isFile(),
    size: stats.size,
    created: stats.birthtime.toISOString(),
    modified: stats.mtime.toISOString(),
    accessed: stats.atime.toISOString(),
  };
}

export function registerGetMetadata() {
  return {
    name: "get_metadata",
    description: "Get metadata about a file or directory.",
    inputSchema: {
      type: "object" as const,
      properties: {
        path: {
          type: "string",
          description: "The path to the file or directory",
        },
      },
      required: ["path"],
    },
  };
}
