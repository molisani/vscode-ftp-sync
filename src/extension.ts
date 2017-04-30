import vscode = require("vscode");
import fs = require("fs");
import path = require("path");

import { DEFAULT_CONFIG, getConfig, RemoteSyncConfig } from "./sync-config";

import { buildRemoteClient, RemoteClient } from "./remote-client";

import { browseRemote } from "./commands/browse-remote";
import { initializeWorkspace } from "./commands/init-workspace";
import { downloadDirectory, uploadDirectory } from "./commands/sync-directory";
import { downloadSelected, uploadSelected } from "./commands/sync-selected";
import { showError } from "./output";

interface CommandRegistration {
    command: string;
    action: (client: RemoteClient, absolutePath?: string) => Promise<any>;
}

const COMMAND_REGISTRATIONS: CommandRegistration[] = [
    {
        "command": "extension.remotesync.upload",
        "action": uploadDirectory,
    },
    {
        "command": "extension.remotesync.download",
        "action": downloadDirectory,
    },
    {
        "command": "extension.remotesync.uploadcurrent",
        "action": uploadSelected,
    },
    {
        "command": "extension.remotesync.downloadcurrent",
        "action": downloadSelected,
    },
    {
        "command": "extension.remotesync.uploadselectedfile",
        "action": uploadSelected,
    },
    {
        "command": "extension.remotesync.downloadselectedfile",
        "action": downloadSelected,
    },
        {
        "command": "extension.remotesync.uploadselecteddirectory",
        "action": uploadSelected,
    },
    {
        "command": "extension.remotesync.downloadselecteddirectory",
        "action": downloadSelected,
    },
    {
        "command": "extension.remotesync.browseremote",
        "action": browseRemote,
    },
];

export function activate(context: vscode.ExtensionContext) {

  const init = vscode.commands.registerCommand("extension.remotesync.init", initializeWorkspace);
  context.subscriptions.push(init);

  const performAction = (action: (client: RemoteClient, absolutePath?: string) => Promise<any>, absolutePath?: string) => {
    const config = getConfig();
    if (config === undefined) {
      showError("Error getting config.");
      return;
    }
    return buildRemoteClient(config).then((client) => {
      action(client, absolutePath).then(() => {
        client.close();
      }).catch((err) => {
        showError(err);
        client.close();
      });
    });
  };

  COMMAND_REGISTRATIONS.forEach((reg) => {
    const command = vscode.commands.registerCommand(reg.command, (uri?: vscode.Uri) => {
      performAction(reg.action, uri && uri.fsPath);
    });
    context.subscriptions.push(command);
  });

  vscode.workspace.onDidSaveTextDocument((document) => {
    const config = getConfig();
    if (config === undefined) {
      showError("Error getting config.");
      return;
    }
    if (config.preferences.uploadOnSave) {
      return buildRemoteClient(config).then((client) => {
        return uploadSelected(client, document.uri.fsPath).then(() => {
          client.close();
        }).catch((err) => {
          showError(err);
          client.close();
        });
      });
    }
  });

}

// this method is called when your extension is deactivated
export function deactivate() {
  //
}
