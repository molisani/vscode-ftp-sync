import vscode = require('vscode');
import fs = require('fs');

import { RemoteSyncConfig, DEFAULT_CONFIG, getConfig } from "./sync-config";

import { onSave } from "./on-save";
import { buildRemoteClient, RemoteClient } from "./remote-client";

import { initializeWorkspace } from "./commands/init-workspace";
import { uploadDirectory, downloadDirectory } from "./commands/sync-directory";
import { commitChanges } from "./commands/commit-changes";
import { uploadCurrent } from "./commands/upload-current";
import { downloadCurrent } from "./commands/download-current";
import { showError } from "./output";



interface CommandRegistration {
    command: string;
    action: (config: RemoteSyncConfig, client: RemoteClient) => Promise<void>;
}

const COMMAND_REGISTRATIONS: CommandRegistration[] = [
    {
        command: "extension.remotesync.upload",
        action: uploadDirectory,
    },
    {
        command: "extension.remotesync.download",
        action: downloadDirectory,
    },
    {
        command: "extension.remotesync.commit",
        action: commitChanges,
    },
    // {
    //     command: "extension.remotesync.init",
    //     action: initializeWorkspace,
    // },
    {
        command: "extension.remotesync.uploadselected",
        action: uploadCurrent,
    },
    {
        command: "extension.remotesync.downloadselected",
        action: downloadCurrent,
    }
]



// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "vscode-ftp-sync" is now active!');


  const init = vscode.commands.registerCommand("extension.remotesync.init", initializeWorkspace);
  context.subscriptions.push(init);

  const performAction = (action: (config: RemoteSyncConfig, client: RemoteClient) => Promise<void>) => {
    const config = getConfig();
    if (config === undefined) {
      showError("Error getting config.");
      return;
    }
    buildRemoteClient(config.connection).then((client) => {
      action(config, client).then(() => {
        console.log('CLOSING!');
        client.close();
      });
    });
  };

  COMMAND_REGISTRATIONS.forEach((reg) => {
    const command = vscode.commands.registerCommand(reg.command, () => {
      performAction(reg.action);
    });
    context.subscriptions.push(command);
  });


  vscode.workspace.onDidSaveTextDocument((document) => {
    performAction((config, client) => {
      return onSave(document, config, client);
    });
  });

}

// this method is called when your extension is deactivated
export function deactivate() {

}