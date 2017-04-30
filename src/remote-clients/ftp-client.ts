import fs = require("fs");
import upath = require("upath");

import { Filesystem, ListEntry, PathBuilder } from "../remote-client";

import Client = require("ftp");

export interface FTPConnection extends Client.Options {
  protocol: "ftp";
  useCompression?: boolean;
}

export class FTPRemoteFilesystem implements Filesystem {
  public static create(desc: FTPConnection): Promise<FTPRemoteFilesystem> {
    return new Promise<FTPRemoteFilesystem>((resolve, reject) => {
      const clientOptions: Client.Options = Object.assign({}, desc);
      const client = new Client();
      client.on("ready", () => {
        resolve(new FTPRemoteFilesystem(client, desc));
      });
      client.connect(clientOptions);
    });
  }
  private constructor(private _client: Client, private _options: FTPConnection) {
  }
  public path(): PathBuilder {
    return upath;
  }
  public close(): void {
    this._client.end();
  }
  public downloadFile(absoluteRemotePath: string, absoluteLocalPath: string): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      this._client.get(absoluteRemotePath, !!this._options.useCompression, (err, stream) => {
        if (!err) {
          stream.pipe(fs.createWriteStream(absoluteLocalPath)).on("close", resolve);
        } else {
          reject(err);
        }
      });
    });
  }
  public uploadFile(absoluteRemotePath: string, absoluteLocalPath: string): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      this._client.put(absoluteLocalPath, absoluteRemotePath, !!this._options.useCompression, (err) => {
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
      this._client.delete(absoluteRemotePath, (err) => {
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
      this._client.mkdir(absoluteRemotePath, (err) => {
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
      this._client.rmdir(absoluteRemotePath, (err) => {
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
      this._client.list(absoluteRemotePath, !!this._options.useCompression, (err, listings) => {
        if (err) {
          return reject(err);
        }
        const entries: ListEntry[] = listings.map((listing) => {
          const entry: ListEntry = {
            "name": listing.name,
            "isDirectory": listing.type === "d",
            "lastModified": listing.date.getTime(),
            "size": Number(listing.size),
            "depth": 0,
          };
          return entry;
        });
        resolve(entries);
      });
    });
  }
}
