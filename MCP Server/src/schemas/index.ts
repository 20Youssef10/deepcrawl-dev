import { z } from "zod";

export const ReadFileSchema = z.object({
  path: z.string(),
  lines: z.number().optional(),
});

export type ReadFileInput = z.infer<typeof ReadFileSchema>;

export const WriteFileSchema = z.object({
  path: z.string(),
  content: z.string(),
});

export type WriteFileInput = z.infer<typeof WriteFileSchema>;

export const DeleteFileSchema = z.object({
  path: z.string(),
});

export type DeleteFileInput = z.infer<typeof DeleteFileSchema>;

export const CreateDirectorySchema = z.object({
  path: z.string(),
});

export type CreateDirectoryInput = z.infer<typeof CreateDirectorySchema>;

export const DeleteDirectorySchema = z.object({
  path: z.string(),
  recursive: z.boolean().optional(),
});

export type DeleteDirectoryInput = z.infer<typeof DeleteDirectorySchema>;

export const ListDirectorySchema = z.object({
  path: z.string(),
});

export type ListDirectoryInput = z.infer<typeof ListDirectorySchema>;

export const MoveSchema = z.object({
  from: z.string(),
  to: z.string(),
});

export type MoveInput = z.infer<typeof MoveSchema>;

export const GetMetadataSchema = z.object({
  path: z.string(),
});

export type GetMetadataInput = z.infer<typeof GetMetadataSchema>;

export const SearchFilesSchema = z.object({
  path: z.string(),
  pattern: z.string(),
});

export type SearchFilesInput = z.infer<typeof SearchFilesSchema>;

export const ExecuteCommandSchema = z.object({
  command: z.string(),
  cwd: z.string().optional(),
  timeout: z.number().optional(),
});

export type ExecuteCommandInput = z.infer<typeof ExecuteCommandSchema>;
