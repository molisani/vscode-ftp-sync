import vscode = require("vscode");
import fs = require("fs");
import path = require("path");

import { setStatusBarMessage } from "../output";
import { RemoteClient } from "../remote-client";
import { RemoteSyncConfig } from "../sync-config";

function syncSelected(isUpload: boolean, client: RemoteClient, absolutePath: string = vscode.window.activeTextEditor.document.uri.fsPath): Promise<any> {
  const filePath = path.relative(vscode.workspace.rootPath, absolutePath);
  const action = (isUpload) ? client.uploadFile(filePath) : client.downloadFile(filePath);
  return action.then(() => {
    return setStatusBarMessage(`'${filePath}' successfully ${isUpload ? "uploaded to" : "downloaded from"} remote.`);
  });
}

export function uploadSelected(client: RemoteClient, absolutePath?: string): Promise<any> {
  return syncSelected(true, client, absolutePath);
}

export function downloadSelected(client: RemoteClient, absolutePath?: string): Promise<any> {
  return syncSelected(false, client, absolutePath);
}

export function removeSelected(client: RemoteClient, absolutePath: string = vscode.window.activeTextEditor.document.uri.fsPath): Promise<any> {
  const filePath = path.relative(vscode.workspace.rootPath, absolutePath);
  const action = client.removeFile(filePath).then(() => {
    fs.unlinkSync(absolutePath);
  });
  return action.then(() => {
    return setStatusBarMessage(`'${filePath}' successfully removed from remote.`);
  });
}
