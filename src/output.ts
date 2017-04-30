import vscode = require("vscode");
import fs = require("fs");
import path = require("path");

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

export function showQuickPick<T>(options: QuickPickOption<T>[], message: string, fallback?: T): Promise<T> {
  return new Promise((resolve, reject) => {
    vscode.window.showQuickPick(options, {
      "placeHolder": message,
    }).then((result) => {
      if (result !== undefined) {
        resolve(result.value);
      } else {
        if (fallback !== undefined) {
          resolve(fallback);
        } else {
          reject(new Error("No quick pick option was selected"));
        }
      }
    });
  });
}

function clear(editBuilder: vscode.TextEditorEdit): void {
  editBuilder.delete(new vscode.Range(
    new vscode.Position(0, 0),
    new vscode.Position(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER),
  ));
}

export function displayTempFile(contents: string): PromiseLike<vscode.Disposable> {
  const filePath = path.join(vscode.workspace.rootPath, ".vscode", `sync-diff_${Math.floor(Date.now() / 1000)}.json`);
  const uri = vscode.Uri.parse(`untitled:${filePath}`);
  return vscode.workspace.openTextDocument(uri).then((document) => {
    return vscode.window.showTextDocument(document).then(() => {
      const fill = (editBuilder: vscode.TextEditorEdit) => {
        editBuilder.insert(new vscode.Position(0, 0), contents);
      };
      return vscode.window.activeTextEditor.edit(clear).then(() => {
        return vscode.window.activeTextEditor.edit(fill).then(() => {
          return vscode.Disposable.from({
            "dispose": () => {
              vscode.window.activeTextEditor.hide();
            },
          });
        });
      });
    });
  });
}
