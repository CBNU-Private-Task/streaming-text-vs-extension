import * as vscode from "vscode";
import { sendRequest } from "./send-request";
import { getResponse } from "./get-response"; 

export function activate(context: vscode.ExtensionContext) {
  console.log(
    'Congratulations, your extension "streaming-extension" is now active!'
  );

  const disposable = vscode.commands.registerCommand(
    "streaming-extension.helloWorld",
    () => {
      getResponse();
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
