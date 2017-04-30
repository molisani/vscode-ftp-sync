import fs = require("fs");
import vscode = require("vscode");
import path = require("path");

import { initializeWorkspace } from "./commands/init-workspace";
import { QuickPickOption, showQuickPick } from "./output";

export interface ConnectionConfig {
  host: string;
  username: string;
  password: string;
  port: number;
  secure: boolean;
  protocol: "ftp" | "sftp" | "local";
  privateKeyPath?: string;
  passphrase?: string;
  agent?: string;
}

export type SyncSafety = "full" | "safe" | "force";

export interface IncludeGlobs {
  type: "include";
  globs: string[];
}

export interface ExcludeGlobs {
  type: "exclude";
  globs: string[];
}

export type PathMatching = IncludeGlobs | ExcludeGlobs;

export interface SyncPreferences {
  uploadOnSave: boolean;
  safety?: SyncSafety;

  remotePathMatching?: PathMatching;
  localPathMatching?: PathMatching;
}

export interface RemoteSyncConfig {
  remotePath: string;
  connection: ConnectionConfig;

  preferences: SyncPreferences;
  debug: boolean;

  generatedFiles?: {
    uploadOnSave: boolean;
    extensionsToInclude: string[];
    path: string;
  }
}

export const DEFAULT_CONFIG: RemoteSyncConfig = {
  "remotePath": "./",
  "connection": {
    "host": "host",
    "username": "username",
    "password": "password",
    "port": 21,
    "secure": false,
    "protocol": "ftp",
  },
  "preferences": {
    "uploadOnSave": false,
    "remotePathMatching": {
      "type": "exclude",
      "globs": [
        ".vscode",
        ".git",
        ".DS_Store",
      ],
    },
  },
  "debug": false,
};

export function getConfigDir(): string {
  return path.join(vscode.workspace.rootPath, ".vscode");
}

export function getConfigPath(): string {
  return path.join(getConfigDir(), "remote-sync.json");
}

export function validateConfig(): boolean {
  if (!fs.existsSync(getConfigPath())) {
    const options = [
      "Create config for workspace",
      "Cancel",
    ];
    const pick = vscode.window.showQuickPick(options, {
      "placeHolder": "No config file found, initialize workspace first.",
    }).then((answer) => {
      if (answer === options[0]) {
        initializeWorkspace();
      }
    });
    return false;
  }
  return true;
}

export function getConfig(): RemoteSyncConfig | undefined {
  if (!validateConfig()) {
    return undefined;
  }
  const configJson = fs.readFileSync(getConfigPath()).toString();
  let config: RemoteSyncConfig | undefined;
  try {
    config = JSON.parse(configJson);
  } catch (err) {
    vscode.window.showErrorMessage(`REMOTE-SYNC: Config file at ${getConfigPath()} is not a valid JSON document - ${err.message}`);
  }
  return config;
}

export function askForSafety(isUpload: boolean): Promise<SyncSafety> {
  return showQuickPick<SyncSafety>([
    {
      "label": "Full",
      "description": `Removes orphan files from ${isUpload ? "remote" : "local"}`,
      "value": "full",
    },
    {
      "label": "Safe",
      "description": `Ignores orphan files on ${isUpload ? "remote" : "local"}`,
      "value": "safe",
    },
    {
      "label": "Force",
      "description": `${isUpload ? "Uploads" : "Downloads"} all files, even if unchanged`,
      "value": "force",
    },
  ], "Please select sync safety level.");
}
