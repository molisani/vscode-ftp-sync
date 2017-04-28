
import { ConnectionDescriptor } from "./sync-config";

export interface ListEntry {
  name: string;
  type: "file" | "directory";
  size: number;
}

export interface RemoteFilesystem {
  downloadFile(localPath: string, remotePath: string): Promise<void>;
  uploadFile(localPath: string, remotePath: string): Promise<void>;
  deleteFile(remotePath: string): Promise<void>;
  createDir(remotePath: string): Promise<void>;
  deleteDir(remotePath: string): Promise<void>;
  listDir(remotePath: string): Promise<ListEntry[]>;
  close(): void;
}

export class RemoteClient {
  constructor(private _fs: RemoteFilesystem) {

  }
  public listRemoteFiles(remotePath: string) {
    return this._fs.listDir(remotePath).then((entries) => {
      console.log(entries);
    });
  }
  public close(): void {
    return this._fs.close();
  }
}

function _buildRemoteClientFromFilesystem(fs: RemoteFilesystem): RemoteClient {
  return new RemoteClient(fs);
}


import { SFTPRemoteFilesystem } from "./remote-clients/sftp-client";
export function buildRemoteClient(desc: ConnectionDescriptor): Promise<RemoteClient> {
  if (desc.protocol === "sftp") {
    return SFTPRemoteFilesystem.create(desc).then(_buildRemoteClientFromFilesystem);
  }
  return SFTPRemoteFilesystem.create(desc).then(_buildRemoteClientFromFilesystem);
}
