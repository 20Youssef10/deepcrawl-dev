import { glob } from "glob";
import { SearchFilesSchema } from "../../schemas/index.js";
import type { SearchFilesInput } from "../../schemas/index.js";
import type { DirectoryEntry } from "../../types/index.js";

export async function searchFiles(
  input: SearchFilesInput,
): Promise<DirectoryEntry[]> {
  const { path: searchPath, pattern } = SearchFilesSchema.parse(input);

  const files = await glob(pattern, {
    cwd: searchPath,
    absolute: true,
  });

  const results: DirectoryEntry[] = [];

  for (const file of files) {
    try {
      const stat = await import("node:fs/promises").then((fs) => fs.stat(file));
      results.push({
        name: file.split("/").pop() || file,
        path: file,
        isDirectory: stat.isDirectory(),
        isFile: stat.isFile(),
        size: stat.size,
      });
    } catch {
      results.push({
        name: file.split("/").pop() || file,
        path: file,
        isDirectory: false,
        isFile: true,
        size: 0,
      });
    }
  }

  return results;
}

export function registerSearchFiles() {
  return {
    name: "search_files",
    description: "Search for files matching a glob pattern.",
    inputSchema: {
      type: "object" as const,
      properties: {
        path: {
          type: "string",
          description: "The directory to search in",
        },
        pattern: {
          type: "string",
          description: "The glob pattern to match (e.g., '*.ts', '**/*.js')",
        },
      },
      required: ["path", "pattern"],
    },
  };
}
