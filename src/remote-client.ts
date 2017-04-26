
import { ConnectionDescriptor } from "./sync-config";

export interface ListEntry {
  name: string;
  type: "file" | "directory";
  size: number;
}

export interface RemoteClient {
  connect(): Promise<void>;
  downloadFile(localPath: string, remotePath: string): Promise<void>;
  uploadFile(localPath: string, remotePath: string): Promise<void>;
  deleteFile(remotePath: string): Promise<void>;
  createDir(remotePath: string): Promise<void>;
  deleteDir(remotePath: string): Promise<void>;
  listDir(remotePath: string): Promise<ListEntry[]>;
  close(): void;
}

import { SFTPRemoteClient } from "./remote-clients/sftp-client";
export function buildRemoteClient(desc: ConnectionDescriptor): RemoteClient {
  if (desc.protocol === "sftp") {
    return new SFTPRemoteClient(desc);
  }
  return new SFTPRemoteClient(desc);
}
