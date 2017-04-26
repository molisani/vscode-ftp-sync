import vscode = require("vscode");

export function showError(message: string): Thenable<string> {
  return vscode.window.showErrorMessage(`REMOTE-SYNC: ${message}`);
}

export const STATUS_TIMEOUT = 3000;

export function setStatusBarMessage(message: string, timeout?: number): vscode.Disposable {
  if (timeout === undefined) {
    return vscode.window.setStatusBarMessage(`REMOTE-SYNC: ${message}`);
  } else {
    return vscode.window.setStatusBarMessage(`REMOTE-SYNC: ${message}`, timeout);
  }
}
