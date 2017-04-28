import fs = require("fs");
import path = require("path");
import Mode = require("stat-mode");

import { ConnectionDescriptor } from "../sync-config";
import { ListEntry, RemoteFilesystem } from "../remote-client";

import { Client, ConnectConfig, SFTPWrapper } from "ssh2";

export class SFTPRemoteFilesystem implements RemoteFilesystem {
  public static create(desc: ConnectionDescriptor): Promise<SFTPRemoteFilesystem> {
    return new Promise<SFTPRemoteFilesystem>((resolve, reject) => {
      let privateKey: Buffer | undefined = undefined;
      if (desc.privateKeyPath) {
        try {
          privateKey = fs.readFileSync(desc.privateKeyPath);
        } catch (err) {
          return reject(err);
        }
      }

      const client = new Client();

      client.on("ready", () => {
        client.sftp((err, sftp) => {
          if (!err) {
            const remoteClient = new SFTPRemoteFilesystem(desc.remotePath, client, sftp);
            resolve(remoteClient);
          } else {
            reject(err);
          }
        });
      });

      const config: ConnectConfig = {
        host: desc.host,
        port: desc.port,
        username: desc.username,
        password: desc.password,
        privateKey: privateKey,
        passphrase: desc.passphrase,
        agent: desc.agent
      };

      client.connect(config);
    });
  }
  private constructor(private _remoteRoot: string, private _client: Client, private _sftp: SFTPWrapper) {
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
      const actualRemotePath = path.posix.join(this._remoteRoot, remotePath);
      console.log(actualRemotePath);
      this._sftp.readdir(actualRemotePath, (err, list) => {
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
      // this._sftp.mkdir(remotePath, (err) => {
      //   if (!err) {
      //     resolve();
      //   } else {
      //     reject(err);
      //   }
      // });
    });
  }
}
