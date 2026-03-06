export interface FileMetadata {
  name: string;
  path: string;
  isDirectory: boolean;
  isFile: boolean;
  size: number;
  created: Date;
  modified: Date;
  accessed: Date;
}

export interface DirectoryEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  isFile: boolean;
  size: number;
}

export interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  timedOut: boolean;
  duration: number;
}
