import { execa } from "execa";
import { ExecuteCommandSchema } from "../../schemas/index.js";
import type { ExecuteCommandInput } from "../../schemas/index.js";

export async function executeCommand(
  input: ExecuteCommandInput,
): Promise<{
  stdout: string;
  stderr: string;
  exitCode: number;
  timedOut: boolean;
  duration: number;
}> {
  const { command, cwd, timeout } = ExecuteCommandSchema.parse(input);

  const startTime = Date.now();

  try {
    const result = await execa(command, {
      shell: true,
      cwd: cwd || process.cwd(),
      timeout: timeout || 300000,
      reject: false,
      cleanup: true,
    });

    const duration = Date.now() - startTime;

    return {
      stdout: result.stdout || "",
      stderr: result.stderr || "",
      exitCode: result.exitCode || 0,
      timedOut: false,
      duration,
    };
  } catch (error: unknown) {
    const duration = Date.now() - startTime;
    const err = error as Error & { timedOut?: boolean };

    return {
      stdout: "",
      stderr: err.message || String(error),
      exitCode: 1,
      timedOut: err.timedOut || false,
      duration,
    };
  }
}

export function registerExecuteCommand() {
  return {
    name: "execute_command",
    description:
      "Execute a shell command and return the output. Supports any command available in the system shell.",
    inputSchema: {
      type: "object" as const,
      properties: {
        command: {
          type: "string",
          description: "The shell command to execute",
        },
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
  };
}
