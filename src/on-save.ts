import path = require("path");
import vscode = require("vscode");

import { getConfig, RemoteSyncConfig } from "./sync-config";
import { shouldIgnore } from "./should-ignore";
import { setStatusBarMessage, showError, STATUS_TIMEOUT } from "./output";
import { RemoteClient, buildRemoteClient } from "./remote-client";

export function onSave(document: vscode.TextDocument, config: RemoteSyncConfig, client: RemoteClient): Promise<void> {

  const currentFilePath = document.uri.fsPath;

  return Promise.resolve();

  // if (shouldIgnore(config.include, config.exclude, currentFilePath)) {
  //   return Promise.resolve();
  // }

  // const fileName = path.basename(currentFilePath);
  // const uploadingStatus = setStatusBarMessage(`Uploading "${fileName}" to server...`);

  // return client.uploadFile(currentFilePath, vscode.workspace.rootPath).then(() => {
  //   uploadingStatus.dispose();
  //   setStatusBarMessage(`"${fileName}" uploaded successfully!`, STATUS_TIMEOUT);
  // }).catch((err) => {
  //   showError(`Uploading "${fileName}" failed: ${err}`);
  // });
};
