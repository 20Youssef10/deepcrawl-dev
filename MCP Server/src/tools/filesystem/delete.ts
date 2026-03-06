import * as fs from "node:fs/promises";
import { DeleteFileSchema } from "../../schemas/index.js";
import type { DeleteFileInput } from "../../schemas/index.js";

export async function deleteFile(input: DeleteFileInput): Promise<string> {
  const { path: filePath } = DeleteFileSchema.parse(input);

  const stats = await fs.stat(filePath);
  if (stats.isDirectory()) {
    throw new Error(`Path is a directory, use delete_directory instead: ${filePath}`);
  }

  await fs.unlink(filePath);
  return `File deleted successfully: ${filePath}`;
}

export function registerDeleteFile() {
  return {
    name: "delete_file",
    description: "Delete a file from the filesystem.",
    inputSchema: {
      type: "object" as const,
      properties: {
        path: {
          type: "string",
          description: "The path to the file to delete",
        },
      },
      required: ["path"],
    },
  };
}
