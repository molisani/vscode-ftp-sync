import vscode = require("vscode");
import path = require("path");

import { askForSafety, ConnectionConfig, PathMatching, RemoteSyncConfig, SyncSafety } from "./sync-config";

import { setStatusBarMessage } from "./output";
import { LocalFilesystem } from "./remote-clients/local-client";
import { SFTPRemoteFilesystem } from "./remote-clients/sftp-client";
import { shouldIgnore } from "./should-ignore";

export interface PathBuilder {
  join(...paths: string[]): string;
}

export interface ListEntry {
  name: string;
  isDirectory: boolean;
  lastModified: number;
  size: number;
  depth: number;
}

function entryChanged(a: ListEntry, b: ListEntry): boolean {
  return (a.size !== b.size);
}

function byDepthAsc(a: ListEntry, b: ListEntry): number {
  return a.depth - b.depth;
}

function byDepthDesc(a: ListEntry, b: ListEntry): number {
  return b.depth - a.depth;
}

export interface Filesystem {
  path(): PathBuilder;
  downloadFile(absoluteRemotePath: string, absoluteLocalPath: string): Promise<any>;
  uploadFile(absoluteRemotePath: string, absoluteLocalPath: string): Promise<any>;
  deleteFile(absoluteRemotePath: string): Promise<any>;
  createDir(absoluteRemotePath: string): Promise<any>;
  deleteDir(absoluteRemotePath: string, recursive: boolean): Promise<any>;
  listDir(absoluteRemotePath: string): Promise<ListEntry[]>;
  close(): void;
}

function flatten<T>(arr: (T | T[])[]): T[] {
  return [].concat.apply([], arr);
}

interface FilesystemMap {
  [path: string]: ListEntry;
}

function createFilesystemMap(entries: ListEntry[]): FilesystemMap {
  return entries.reduce((agg, entry) => {
    agg[path.normalize(entry.name)] = entry;
    return agg;
  }, {});
}

export interface SyncDiff {
  isUpload: boolean;
  filesChanged: ListEntry[];
  filesAdded: ListEntry[];
  filesRemoved: ListEntry[];
  directoriesAdded: ListEntry[];
  directoriesRemoved: ListEntry[];
}

function buildDiff(remoteEntries: ListEntry[], localEntries: ListEntry[], safety: SyncSafety, isUpload: boolean): SyncDiff {
  const fromEntries = isUpload ? localEntries : remoteEntries;
  const toEntries = isUpload ? remoteEntries : localEntries;
  const fromMap = createFilesystemMap(fromEntries);
  const toMap = createFilesystemMap(toEntries);

  const diff: SyncDiff = {
    "isUpload": isUpload,
    "filesChanged": [],
    "filesAdded": [],
    "filesRemoved": [],
    "directoriesAdded": [],
    "directoriesRemoved": [],
  };

  const hasFromEquivalent: FilesystemMap = {};

  fromEntries.forEach((entry) => {
    const equivalent = toMap[path.normalize(entry.name)];
    if (equivalent) {
      if (!entry.isDirectory && (safety === "force" || entryChanged(entry, equivalent))) {
        diff.filesChanged.push(entry);
      }
    } else {
      if (entry.isDirectory) {
        diff.directoriesAdded.push(entry);
      } else {
        diff.filesAdded.push(entry);
      }
    }
  });

  if (safety === "full") {
    toEntries.forEach((entry) => {
      const equivalent = fromMap[path.normalize(entry.name)];
      if (!equivalent) {
        if (entry.isDirectory) {
          diff.directoriesRemoved.push(entry);
        } else {
          diff.filesRemoved.push(entry);
        }
      }
    });
  }

  return diff;
}

function newSelfDirectory(): ListEntry {
  return {
    "name": ".",
    "isDirectory": true,
    "lastModified": 0,
    "size": 0,
    "depth": 0,
  };
}

export class RemoteClient {
  private _local: LocalFilesystem = new LocalFilesystem();
  private _remoteRoot: string;
  private _localRoot: string;
  constructor(private _remote: Filesystem, private _config: RemoteSyncConfig) {
    this._remoteRoot = this._config.remotePath;
    this._localRoot = vscode.workspace.rootPath;
  }
  public buildSyncDiff(isUpload: boolean, relativePath: string = ".", safety?: SyncSafety): Promise<SyncDiff> {
    console.log(`buildSyncDiff(isUpload=${isUpload}, relativePath=${relativePath}, safety=${safety})`);
    const remoteEntries = this._listRemoteFiles(relativePath);
    const localEntries = new Promise<ListEntry[]>((resolve) => {
      this._listLocalFiles(relativePath).then(resolve).catch(() => resolve([]));
    });
    let getSafety: Promise<SyncSafety>;
    if (safety !== undefined) {
      getSafety = Promise.resolve(safety);
    } else {
      if (this._config.preferences.safety !== undefined) {
        getSafety = Promise.resolve(this._config.preferences.safety);
      } else {
        getSafety = askForSafety(isUpload);
      }
    }
    return Promise.all([remoteEntries, localEntries, getSafety]).then((results) => {
      if (relativePath !== ".") {
        results[0].push(newSelfDirectory());
        results[1].push(newSelfDirectory());
        results[0].forEach((entry) => entry.name = this._remote.path().join(relativePath, entry.name));
        results[1].forEach((entry) => entry.name = this._local.path().join(relativePath, entry.name));
      }
      return buildDiff(results[0], results[1], results[2], isUpload);
    });
  }
  public executeSyncDiff(isUpload: boolean, diff: SyncDiff): Promise<any> {
    let createDir: (dir: ListEntry) => Promise<any>;
    let removeDir: (dir: ListEntry) => Promise<any>;
    let replaceFile: (file: ListEntry) => Promise<any>;
    let removeFile: (file: ListEntry) => Promise<any>;
    if (isUpload) {
      createDir = this._createDirRemote.bind(this);
      removeDir = this._removeDirRemote.bind(this);
      replaceFile = this._replaceFileRemote.bind(this);
      removeFile = this._removeFileRemote.bind(this);
    } else {
      createDir = this._createDirLocal.bind(this);
      removeDir = this._removeDirLocal.bind(this);
      replaceFile = this._replaceFileLocal.bind(this);
      removeFile = this._removeFileLocal.bind(this);
    }

    diff.directoriesAdded.sort(byDepthAsc);
    const createdDirectories = diff.directoriesAdded.map(createDir);
    return Promise.all(createdDirectories).then(() => {
      const createdFiles = diff.filesAdded.map(replaceFile);
      const changedFiles = diff.filesChanged.map(replaceFile);
      const removedFiles = diff.filesRemoved.map(removeFile);
      return Promise.all([...createdFiles, ...changedFiles, ...removedFiles]).then(() => {
        diff.directoriesRemoved.sort(byDepthDesc);
        const removedDirectories = diff.directoriesRemoved.map(removeDir);
        return Promise.all(removedDirectories).then(() => undefined);
      });
    }).then(() => {
      return setStatusBarMessage(`Successfully executed sync ${isUpload ? "on" : "from"} remote.`);
    });
  }
  public uploadFile(relativePath: string): Promise<any> {
    return this._replaceFileRemote({ "name": relativePath });
  }
  public downloadFile(relativePath: string): Promise<any> {
    return this._replaceFileLocal({ "name": relativePath });
  }
  public removeFile(relativePath: string): Promise<any> {
    return this._removeFileRemote({ "name": relativePath });
  }
  public downloadDirectory(relativePath: string, force: boolean): Promise<any> {
    return this.buildSyncDiff(false, relativePath, force ? "force" : "full").then((diff) => {
      return this.executeSyncDiff(false, diff);
    });
  }
  public removeDirectory(relativePath: string): Promise<any> {
    return this._listRemoteFiles(relativePath).then((remoteEntries) => {
      remoteEntries.push(newSelfDirectory());
      remoteEntries.forEach((entry) => entry.name = this._remote.path().join(relativePath, entry.name));
      return buildDiff(remoteEntries, [], "full", true);
    }).then((diff) => {
      console.log(diff);
    });
  }
  public listContents(directoryPath: string): Promise<ListEntry[]> {
    return this._remote.listDir(this._absoluteRemotePath(directoryPath));
  }
  public close(): void {
    return this._remote.close();
  }
  private _absoluteRemotePath(remotePath: string): string {
    return this._remote.path().join(this._remoteRoot, remotePath, ".");
  }
  private _absoluteLocalPath(localPath: string): string {
    return this._local.path().join(this._localRoot, localPath, ".");
  }
  private listAllEntries(fs: Filesystem, absoluteBasePath: string, pathMatching: PathMatching | undefined): Promise<ListEntry[]> {
    const getAllEntriesRecursively = (basePath: string, depth: number): Promise<ListEntry[]> =>  {
      const currentPath = fs.path().join(absoluteBasePath, basePath);
      return fs.listDir(currentPath).then((entries) => {
        return Promise.all<ListEntry | ListEntry[]>(entries.filter((entry) => {
          entry.name = fs.path().join(basePath, entry.name);
          return !shouldIgnore(entry.name, pathMatching);
        }).map((entry) => {
          entry.depth = depth;
          if (entry.isDirectory) {
            return getAllEntriesRecursively(entry.name, depth + 1).then((subentries) => {
              subentries.push(entry);
              return subentries;
            });
          } else {
            return Promise.resolve(entry);
          }
        })).then(flatten);
      });
    };
    return getAllEntriesRecursively(".", 0);
  }
  private _listRemoteFiles(remotePath: string): Promise<ListEntry[]> {
    return this.listAllEntries(this._remote, this._absoluteRemotePath(remotePath), this._config.preferences.remotePathMatching);
  }
  private _listLocalFiles(localPath: string): Promise<ListEntry[]> {
    return this.listAllEntries(this._local, this._absoluteLocalPath(localPath), this._config.preferences.localPathMatching);
  }
  private _createDirRemote(dir: { name: string }): Promise<any> {
    return this._remote.createDir(this._absoluteRemotePath(dir.name));
  }
  private _createDirLocal(dir: { name: string }): Promise<any> {
    return this._local.createDir(this._absoluteLocalPath(dir.name));
  }
  private _removeDirRemote(dir: { name: string }): Promise<any> {
    return this._remote.deleteDir(this._absoluteRemotePath(dir.name), !!this._config.preferences.remoteRecursiveRemoveDirectory);
  }
  private _removeDirLocal(dir: { name: string }): Promise<any> {
    return this._local.deleteDir(this._absoluteLocalPath(dir.name), !!this._config.preferences.remoteRecursiveRemoveDirectory);
  }
  private _replaceFileRemote(file: { name: string }): Promise<any> {
    return this._remote.uploadFile(this._absoluteRemotePath(file.name), this._absoluteLocalPath(file.name));
  }
  private _replaceFileLocal(file: { name: string }): Promise<any> {
    return this._remote.downloadFile(this._absoluteRemotePath(file.name), this._absoluteLocalPath(file.name));
  }
  private _removeFileRemote(file: { name: string }): Promise<any> {
    return this._remote.deleteFile(this._absoluteRemotePath(file.name));
  }
  private _removeFileLocal(file: { name: string }): Promise<any> {
    return this._local.deleteFile(this._absoluteLocalPath(file.name));
  }
}

function _buildRemoteClientFromFilesystem(fs: Filesystem, config: RemoteSyncConfig): RemoteClient {
  return new RemoteClient(fs, config);
}

export function buildRemoteClient(config: RemoteSyncConfig): Promise<RemoteClient> {
  let fsp: Promise<Filesystem>;
  if (config.connection.protocol === "sftp") {
    fsp = SFTPRemoteFilesystem.create(config.connection);
  } else {
    fsp = Promise.resolve(new LocalFilesystem());
  }
  return fsp.then((fs) => _buildRemoteClientFromFilesystem(fs, config));
}
