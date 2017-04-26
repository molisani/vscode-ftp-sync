import vscode = require('vscode');
import { RemoteSyncConfig, DEFAULT_CONFIG } from "./sync-config";
import { onSave } from "./on-save";
import { buildRemoteClient } from "./remote-client";



// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "vscode-ftp-sync" is now active!');

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand('extension.sayHello', () => {
        // The code you place here will be executed every time your command is executed

        // Display a message box to the user
        vscode.window.showInformationMessage('Hello World!');
    });

    const getCurrentConfig = (): RemoteSyncConfig => {
        return DEFAULT_CONFIG;
    }




    vscode.workspace.onDidSaveTextDocument((document) => {
        const config = getCurrentConfig();
        const client = buildRemoteClient(config.connection);
        onSave(document, client).then(() => {
            client.close();
        });
    });






    context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
}