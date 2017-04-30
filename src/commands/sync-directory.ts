
import { RemoteClient } from "../remote-client";

import { showQuickPick } from "../output";
import { RemoteSyncConfig, validateConfig } from "../sync-config";

function syncDirectory(isUpload: boolean, client: RemoteClient): Promise<any> {
  return client.buildSyncDiff(isUpload).then((diff) => {
    return showQuickPick<"execute" | "review" | "cancel">([
      {
        "label": "Run",
        "description": `Execute sync. Files added: ${diff.filesAdded.length}, modified: ${diff.filesChanged.length}, removed: ${diff.filesRemoved.length}`,
        "value": "execute",
      },
      {
        "label": "Review",
        "description": "View diff in editor before executing.",
        "value": "review",
      },
      {
        "label": "Cancel",
        "description": "Do not perform this sync.",
        "value": "cancel",
      },
    ], "Do you want to perform this sync?").then((action) => {
      if (action === "execute") {
        return client.executeSyncDiff(isUpload, diff);
      }
    });
  });
}

export function uploadDirectory(client: RemoteClient, absolutePath?: string): Promise<any> {
  return syncDirectory(true, client);
}

export function downloadDirectory(client: RemoteClient, absolutePath?: string): Promise<any> {
  return syncDirectory(false, client);
}
