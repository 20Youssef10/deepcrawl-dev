import * as fs from "node:fs/promises";
import { WriteFileSchema } from "../../schemas/index.js";
import type { WriteFileInput } from "../../schemas/index.js";

export async function writeFile(input: WriteFileInput): Promise<string> {
  const { path: filePath, content } = WriteFileSchema.parse(input);

  const dir = filePath.substring(0, filePath.lastIndexOf("/"));
  if (dir) {
    await fs.mkdir(dir, { recursive: true });
  }

  await fs.writeFile(filePath, content, "utf-8");
  return `File written successfully: ${filePath}`;
}

export function registerWriteFile() {
  return {
    name: "write_file",
    description:
      "Create a new file or overwrite an existing file with the given content.",
    inputSchema: {
      type: "object" as const,
      properties: {
        path: {
          type: "string",
          description: "The path to the file to write",
        },
        content: {
          type: "string",
          description: "The content to write to the file",
        },
      },
      required: ["path", "content"],
    },
  };
}
