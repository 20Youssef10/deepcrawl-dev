import * as fs from "node:fs/promises";
import {
  CreateDirectorySchema,
  DeleteDirectorySchema,
} from "../../schemas/index.js";
import type {
  CreateDirectoryInput,
  DeleteDirectoryInput,
} from "../../schemas/index.js";

export async function createDirectory(
  input: CreateDirectoryInput,
): Promise<string> {
  const { path: dirPath } = CreateDirectorySchema.parse(input);

  await fs.mkdir(dirPath, { recursive: true });
  return `Directory created successfully: ${dirPath}`;
}

export async function deleteDirectory(
  input: DeleteDirectoryInput,
): Promise<string> {
  const { path: dirPath, recursive } = DeleteDirectorySchema.parse(input);

  if (recursive) {
    await fs.rm(dirPath, { recursive: true, force: true });
  } else {
    await fs.rmdir(dirPath);
  }
  return `Directory deleted successfully: ${dirPath}`;
}

export function registerCreateDirectory() {
  return {
    name: "create_directory",
    description: "Create a new directory.",
    inputSchema: {
      type: "object" as const,
      properties: {
        path: {
          type: "string",
          description: "The path to the directory to create",
        },
      },
      required: ["path"],
    },
  };
}

export function registerDeleteDirectory() {
  return {
    name: "delete_directory",
    description: "Delete a directory from the filesystem.",
    inputSchema: {
      type: "object" as const,
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
  };
}
