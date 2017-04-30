import fs = require("fs");
import upath = require("upath");
import Mode = require("stat-mode");

import { Filesystem, ListEntry, PathBuilder } from "../remote-client";
import { ConnectionConfig } from "../sync-config";

import { Client, ConnectConfig, SFTPWrapper } from "ssh2";

export class SFTPRemoteFilesystem implements Filesystem {
  public static create(desc: ConnectionConfig): Promise<SFTPRemoteFilesystem> {
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
            const remoteClient = new SFTPRemoteFilesystem(client, sftp);
            resolve(remoteClient);
          } else {
            reject(err);
          }
        });
      });

      const config: ConnectConfig = {
        "host": desc.host,
        "port": desc.port,
        "username": desc.username,
        "password": desc.password,
        "privateKey": privateKey,
        "passphrase": desc.passphrase,
        "agent": desc.agent,
      };

      client.connect(config);
    });
  }
  private constructor(private _client: Client, private _sftp: SFTPWrapper) {
  }
  public path(): PathBuilder {
    return upath;
  }
  public close(): void {
    this._client.end();
  }
  public downloadFile(absoluteRemotePath: string, absoluteLocalPath: string): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      this._sftp.fastGet(absoluteRemotePath, absoluteLocalPath, (err) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
    });
  }
  public uploadFile(absoluteRemotePath: string, absoluteLocalPath: string): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      this._sftp.fastPut(absoluteLocalPath, absoluteRemotePath, (err) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
    });
  }
  public deleteFile(absoluteRemotePath: string): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      this._sftp.unlink(absoluteRemotePath, (err) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
    });
  }
  public createDir(absoluteRemotePath: string): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      this._sftp.mkdir(absoluteRemotePath, (err) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
    });
  }
  public deleteDir(absoluteRemotePath: string): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      this._sftp.rmdir(absoluteRemotePath, (err) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
    });
  }
  public listDir(absoluteRemotePath: string): Promise<ListEntry[]> {
    return new Promise<ListEntry[]>((resolve, reject) => {
      this._sftp.readdir(absoluteRemotePath, (err, list) => {
        if (err) {
          return reject(err);
        }
        const entries: ListEntry[] = list.map((f) => {
          const mode = new Mode(f.attrs);
          const entry: ListEntry = {
            "name": f.filename,
            "isDirectory": mode.isDirectory(),
            "lastModified": f.attrs.mtime,
            "size": f.attrs.size,
            "depth": 0,
          };
          return entry;
        });
        resolve(entries);
      });
    });
  }
}
