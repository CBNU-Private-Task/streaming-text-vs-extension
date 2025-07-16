import * as vscode from "vscode";
import { sendRequest } from "./send-request";
import { getResponse, startFileWriteServer, stopFileWriteServer } from "./get-response"; 

export function activate(context: vscode.ExtensionContext) {
  console.log(
    'Congratulations, your extension "streaming-extension" is now active!'
  );

  startFileWriteServer();

  const disposable = vscode.commands.registerCommand(
    "streaming-extension.helloWorld",
    () => {
      getResponse();
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {
  // Stop the HTTP server when extension deactivates
  stopFileWriteServer();
}
