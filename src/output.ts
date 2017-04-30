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

export interface QuickPickOption<T> {
  label: string;
  description: string;
  value: T;
}

export function showQuickPick<T>(options: QuickPickOption<T>[], message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    vscode.window.showQuickPick(options, {
      "placeHolder": message,
    }).then((result) => {
      if (result !== undefined) {
        resolve(result.value);
      } else {
        reject(new Error("No quick pick option was selected"));
      }
    });
  });
}
