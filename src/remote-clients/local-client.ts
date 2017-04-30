import fs = require("fs");
import path = require("path");

import { Filesystem, ListEntry, PathBuilder } from "../remote-client";
import { ConnectionConfig } from "../sync-config";

export interface LocalConnection {
  protocol: "local";
}

export class LocalFilesystem implements Filesystem {
  private _closed = false;
  public path(): PathBuilder {
    return path;
  }
  public downloadFile(absoluteRemotePath: string, absoluteLocalPath: string): Promise<any> {
    if (this._closed) {
      return Promise.reject(new Error("Connection closed."));
    }
    return new Promise<any>((resolve, reject) => {
      const read = fs.createReadStream(absoluteRemotePath);
      const write = fs.createWriteStream(absoluteLocalPath);
      const stream = read.pipe(write);
      stream.on("finish", resolve);
      stream.on("error", reject);
    });
  }
  public uploadFile(absoluteRemotePath: string, absoluteLocalPath: string): Promise<any> {
    if (this._closed) {
      return Promise.reject(new Error("Connection closed."));
    }
    return new Promise<any>((resolve, reject) => {
      const read = fs.createReadStream(absoluteLocalPath);
      const write = fs.createWriteStream(absoluteRemotePath);
      const stream = read.pipe(write);
      stream.on("finish", resolve);
      stream.on("error", reject);
    });
  }
  public deleteFile(absoluteRemotePath: string): Promise<any> {
    if (this._closed) {
      return Promise.reject(new Error("Connection closed."));
    }
    return new Promise<any>((resolve, reject) => {
      fs.unlink(absoluteRemotePath, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
  public createDir(absoluteRemotePath: string): Promise<any> {
    if (this._closed) {
      return Promise.reject(new Error("Connection closed."));
    }
    return new Promise<any>((resolve, reject) => {
      fs.mkdir(absoluteRemotePath, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
  public deleteDir(absoluteRemotePath: string, recursive: boolean): Promise<any> {
    // TODO: Implement recursive delete
    if (this._closed) {
      return Promise.reject(new Error("Connection closed."));
    }
    return new Promise<any>((resolve, reject) => {
      fs.rmdir(absoluteRemotePath, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
  public listDir(absoluteRemotePath: string): Promise<ListEntry[]> {
    if (this._closed) {
      return Promise.reject(new Error("Connection closed."));
    }
    const buildListEntry = (file: string): Promise<ListEntry> => {
      return new Promise<ListEntry>((resolve, reject) => {
        fs.stat(path.join(absoluteRemotePath, file), (err, stats) => {
          if (err) {
            reject(err);
          } else {
            resolve({
              "name": file,
              "isDirectory": stats.isDirectory(),
              "lastModified": stats.mtime.getTime(),
              "size": stats.size,
              "depth": 0,
            });
          }
        });
      });
    };
    return new Promise<ListEntry[]>((resolve, reject) => {
      fs.readdir(absoluteRemotePath, (err, files) => {
        if (err) {
          reject(err);
        } else {
          resolve(Promise.all(files.map(buildListEntry)));
        }
      });
    });
  }
  public close(): void {
    this._closed = true;
  }
}
