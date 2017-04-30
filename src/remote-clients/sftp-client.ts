import fs = require("fs");
import upath = require("upath");
import Mode = require("stat-mode");

import { Filesystem, ListEntry, PathBuilder } from "../remote-client";

import { Client, ConnectConfig, SFTPWrapper } from "ssh2";

export interface SFTPConnection extends ConnectConfig {
  protocol: "sftp";
  privateKeyPath?: string;
}

export class SFTPRemoteFilesystem implements Filesystem {
  public static create(desc: SFTPConnection): Promise<SFTPRemoteFilesystem> {
    return new Promise<SFTPRemoteFilesystem>((resolve, reject) => {

      const connectConfig: ConnectConfig = Object.assign({}, desc);
      if (desc.privateKeyPath) {
        try {
          connectConfig.privateKey = fs.readFileSync(desc.privateKeyPath);
        } catch (err) {
          return reject(err);
        }
      }

      const client = new Client();
      client.on("ready", () => {
        client.sftp((err, sftp) => {
          if (!err) {
            resolve(new SFTPRemoteFilesystem(client, sftp));
          } else {
            reject(err);
          }
        });
      });
      client.connect(connectConfig);
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
  public deleteDir(absoluteRemotePath: string, recursive: boolean): Promise<any> {
    // TODO: Implement recursive delete
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
