import * as fs from "node:fs/promises";
import { MoveSchema } from "../../schemas/index.js";
import type { MoveInput } from "../../schemas/index.js";

export async function move(input: MoveInput): Promise<string> {
  const { from, to } = MoveSchema.parse(input);

  const stats = await fs.stat(from);
  if (stats.isDirectory()) {
    await fs.rename(from, to);
    return `Directory moved from ${from} to ${to}`;
  }

  const toDir = to.substring(0, to.lastIndexOf("/"));
  if (toDir) {
    await fs.mkdir(toDir, { recursive: true });
  }

  await fs.rename(from, to);
  return `File moved from ${from} to ${to}`;
}

export function registerMove() {
  return {
    name: "move",
    description: "Move or rename a file or directory.",
    inputSchema: {
      type: "object" as const,
      properties: {
        from: {
          type: "string",
          description: "The source path",
        },
        to: {
          type: "string",
          description: "The destination path",
        },
      },
      required: ["from", "to"],
    },
  };
}
