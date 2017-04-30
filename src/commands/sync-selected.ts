import vscode = require("vscode");
import path = require("path");

import { RemoteClient } from "../remote-client";
import { RemoteSyncConfig } from "../sync-config";

function syncSelected(isUpload: boolean, client: RemoteClient, absolutePath?: string): Promise<any> {
  let filePath: string;
  if (absolutePath === undefined) {
    filePath = path.relative(vscode.workspace.rootPath, vscode.window.activeTextEditor.document.uri.fsPath);
  } else {
    filePath = path.relative(vscode.workspace.rootPath, absolutePath);
  }
  return (isUpload) ? client.uploadFile(filePath) : client.downloadFile(filePath);
}

export function uploadSelected(client: RemoteClient, absolutePath?: string): Promise<any> {
  return syncSelected(true, client);
}

export function downloadSelected(client: RemoteClient, absolutePath?: string): Promise<any> {
  return syncSelected(false, client);
}
