import * as fs from "node:fs/promises";
import { ListDirectorySchema } from "../../schemas/index.js";
import type { ListDirectoryInput } from "../../schemas/index.js";
import type { DirectoryEntry } from "../../types/index.js";
import type { DirectoryEntry as DirEntry } from "../../types/index.js";

export async function listDirectory(
  input: ListDirectoryInput,
): Promise<DirectoryEntry[]> {
  const { path: dirPath } = ListDirectorySchema.parse(input);

  const entries = await fs.readdir(dirPath, { withFileTypes: true });

  const result: DirectoryEntry[] = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = `${dirPath}/${entry.name}`.replace(/\/+/g, "/");
      const stats = await fs.stat(fullPath);
      return {
        name: entry.name,
        path: fullPath,
        isDirectory: entry.isDirectory(),
        isFile: entry.isFile(),
        size: stats.size,
      };
    }),
  );

  return result.sort((a, b) => {
    if (a.isDirectory && !b.isDirectory) return -1;
    if (!a.isDirectory && b.isDirectory) return 1;
    return a.name.localeCompare(b.name);
  });
}

export function registerListDirectory() {
  return {
    name: "list_directory",
    description: "List all files and directories in a directory.",
    inputSchema: {
      type: "object" as const,
      properties: {
        path: {
          type: "string",
          description: "The path to the directory to list",
        },
      },
      required: ["path"],
    },
  };
}
