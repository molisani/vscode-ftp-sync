import vscode = require("vscode");
import path = require("path");

import { RemoteClient } from "../remote-client";

import { displayTempFile, QuickPickOption, showQuickPick } from "../output";
import { RemoteSyncConfig, validateConfig } from "../sync-config";

const REVIEW_OPTION: QuickPickOption<"review"> = {
  "label": "Review",
  "description": "View diff in editor before executing.",
  "value": "review",
};

const CANCEL_OPTION: QuickPickOption<"cancel"> = {
  "label": "Cancel",
  "description": "Do not perform this sync.",
  "value": "cancel",
};

function syncDirectory(isUpload: boolean, client: RemoteClient, absolutePath?: string): Promise<any> {
  let relativePath: string | undefined;
  if (absolutePath !== undefined) {
    relativePath = path.relative(vscode.workspace.rootPath, absolutePath);
  }
  return client.buildSyncDiff(isUpload, relativePath).then((diff) => {
    const executeOption: QuickPickOption<"execute"> = {
      "label": "Run",
      "description": `Execute sync. Files added: ${diff.filesAdded.length}, modified: ${diff.filesChanged.length}, removed: ${diff.filesRemoved.length}`,
      "value": "execute",
    };
    return showQuickPick<"execute" | "review" | "cancel">([
      executeOption, REVIEW_OPTION, CANCEL_OPTION,
    ], "Do you want to perform this sync?", "cancel").then((action) => {
      if (action === "execute") {
        return client.executeSyncDiff(isUpload, diff);
      } else if (action === "review") {
        const json = JSON.stringify(diff, null, 4);
        return displayTempFile(json).then((file) => {
          return showQuickPick<"execute" | "cancel">([
            executeOption, CANCEL_OPTION,
          ], "Do you want to perform this sync?", "cancel").then((secondAction) => {
            file.dispose();
            if (secondAction === "execute") {
              return client.executeSyncDiff(isUpload, diff);
            }
          });
        });
      } else {
        return Promise.resolve();
      }
    });
  });
}

export function uploadDirectory(client: RemoteClient, absolutePath?: string): Promise<any> {
  return syncDirectory(true, client, absolutePath);
}

export function downloadDirectory(client: RemoteClient, absolutePath?: string): Promise<any> {
  return syncDirectory(false, client, absolutePath);
}

export function removeDirectory(client: RemoteClient, absolutePath?: string): Promise<any> {
  if (absolutePath !== undefined) {
    const relativePath = path.relative(vscode.workspace.rootPath, absolutePath);
    return client.removeDirectory(relativePath);
  }
  return Promise.resolve();
}
