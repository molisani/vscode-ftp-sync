import fs = require("fs");
import vscode = require("vscode");
import path = require("path")

import { initializeWorkspace } from "./commands/init-workspace";

export interface ConnectionDescriptor {
  remotePath: string;
  host: string;
  username: string;
  password: string;
  port: number;
  secure: boolean;
  protocol: "ftp" | "sftp";
  privateKeyPath?: string;
  passphrase?: string;
  agent?: string;
}

export type SyncSafety = "full" | "safe" | "force";

export interface SyncPreferences {
  uploadOnSave: boolean;
  uploadSafety?: SyncSafety;
  downloadSafety?: SyncSafety;

}

export interface RemoteSyncConfig {
  connection: ConnectionDescriptor;

  uploadOnSave: boolean;
  passive: boolean;
  debug: boolean;
  
  include?: string[];
  exclude?: string[];
  generatedFiles?: {
    uploadOnSave: boolean;
    extensionsToInclude: string[];
    path: string;
  }
}

export const DEFAULT_CONFIG: RemoteSyncConfig = {
  connection: {
    remotePath: "./",
    host: "host",
    username: "username",
    password: "password",
    port: 21,
    secure: false,
    protocol: "ftp",
  },
  uploadOnSave: false,
  passive: false,
  debug: false,
  exclude: [
    ".vscode",
    ".git",
    ".DS_Store"
  ],
};

export function getConfigDir(): string {
  return path.join(vscode.workspace.rootPath, '.vscode');
}

export function getConfigPath(): string {
  return path.join(getConfigDir(), 'remote-sync.json');
}

export function getConfig(): RemoteSyncConfig {
  const configJson = fs.readFileSync(getConfigPath()).toString();
  let config: RemoteSyncConfig;
  try {
    config = JSON.parse(configJson);
  } catch (err) {
    vscode.window.showErrorMessage(`REMOTE-SYNC: Config file at ${getConfigPath()} is not a valid JSON document - ${err.message}`);
    config = DEFAULT_CONFIG;
  }
  return config;
}

export function validateConfig(): boolean {
  if (!fs.existsSync(getConfigPath())) {
    const options = [
      "Create config for workspace",
      "Cancel",
    ];
    const pick = vscode.window.showQuickPick(options, {
      placeHolder: "No config file found, initialize workspace first."
    }).then((answer) => {
      if (answer === options[0]) {
        initializeWorkspace();
      }
    });
    return false;
  }
  return true;
}
