import fs = require("fs");
import vscode = require("vscode");

import { showError } from "./output";

import { DEFAULT_CONFIG, getConfigDir, getConfigPath } from "./sync-config";

export function initializeWorkspace(): void {
  if (!vscode.workspace.rootPath) {
    showError("Cannot initialize remote-sync in non-folder workspace");
    return;
  }

  const configDir = getConfigDir();
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir);
  }

  const configPath = getConfigPath();
  if (fs.existsSync(configPath)) {
    showError("Config file already exists");
  } else {
    fs.writeFileSync(configPath, JSON.stringify(DEFAULT_CONFIG, null, 4));
  }

  vscode.workspace.openTextDocument(configPath).then((document) => {
    vscode.window.showTextDocument(document);
  });
}
