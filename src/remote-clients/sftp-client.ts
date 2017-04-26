import Mode = require("stat-mode");

import { ConnectionDescriptor } from "../sync-config";
import { RemoteClient, ListEntry } from "../remote-client";

import { Client, SFTPWrapper } from "ssh2";

export class SFTPRemoteClient implements RemoteClient {
  private _client: Client;
  private _sftp: SFTPWrapper;
  constructor(desc: ConnectionDescriptor) {
    this._client = new Client();
  }
  public connect(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this._client.sftp((err, sftp) => {
        if (!err) {
          this._sftp = sftp;
          resolve();
        } else {
          reject(err);
        }
      });
    });
  }
  public close(): void {
    this._client.end();
  }
  public downloadFile(localPath: string, remotePath: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this._sftp.fastGet(remotePath, localPath, (err) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
    });
  }
  public uploadFile(localPath: string, remotePath: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this._sftp.fastPut(remotePath, localPath, (err) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
    });
  }
  public deleteFile(remotePath: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this._sftp.unlink(remotePath, (err) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
    });
  }
  public createDir(remotePath: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this._sftp.mkdir(remotePath, (err) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
    });
  }
  public deleteDir(remotePath: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this._sftp.rmdir(remotePath, (err) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
    });
  }
  public listDir(remotePath: string): Promise<ListEntry[]> {
    return new Promise<ListEntry[]>((resolve, reject) => {
      this._sftp.readdir(remotePath, (err, list) => {
        if (err) {
          return reject(err);
        }
        const entries: ListEntry[] = list.map((f) => {
          const mode = new Mode(f.attrs);
          const entry: ListEntry = {
            "name": f.filename,
            "type": mode.isDirectory() ? "directory" : "file",
            "size": f.attrs.size,
          };
          return entry;
        });
        resolve(entries);
      });
      this._sftp.mkdir(remotePath, (err) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
    });
  }
}
