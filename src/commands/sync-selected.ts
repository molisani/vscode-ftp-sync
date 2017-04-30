import vscode = require("vscode");
import path = require("path");

import { setStatusBarMessage } from "../output";
import { RemoteClient } from "../remote-client";
import { RemoteSyncConfig } from "../sync-config";

function syncSelected(isUpload: boolean, client: RemoteClient, absolutePath?: string): Promise<any> {
  let filePath: string;
  if (absolutePath === undefined) {
    filePath = path.relative(vscode.workspace.rootPath, vscode.window.activeTextEditor.document.uri.fsPath);
  } else {
    filePath = path.relative(vscode.workspace.rootPath, absolutePath);
  }
  const action = (isUpload) ? client.uploadFile(filePath) : client.downloadFile(filePath);
  return action.then(() => {
    return setStatusBarMessage(`'${filePath}' successfully ${isUpload ? "uploaded to" : "downloaded from"} remote.`);
  });
}

export function uploadSelected(client: RemoteClient, absolutePath?: string): Promise<any> {
  return syncSelected(true, client);
}

export function downloadSelected(client: RemoteClient, absolutePath?: string): Promise<any> {
  return syncSelected(false, client);
}
