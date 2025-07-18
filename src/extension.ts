import * as vscode from "vscode";
import { getResponse, startFileWriteServer, stopFileWriteServer } from "./get-response";
import { handleLogin, deleteToken, ensureLoggedIn, getToken } from "./auth";

const API_URL = "http://localhost:8000";

export async function activate(context: vscode.ExtensionContext) {
  vscode.window.showInformationMessage('Streaming Extension is now active!');

  // Ensure the user is logged in at startup.
  await ensureLoggedIn(context);

  startFileWriteServer();

  const disposable = vscode.commands.registerCommand(
    "streaming-extension.helloWorld",
    () => {
      getResponse();
    }
  );

  context.subscriptions.push(disposable);

  const loginDisposable = vscode.commands.registerCommand(
    "streaming-extension.login",
    () => handleLogin(context)
  );

  context.subscriptions.push(loginDisposable);

  const logoutDisposable = vscode.commands.registerCommand(
    "streaming-extension.logout",
    async () => {
      await deleteToken(context);
      vscode.window.showInformationMessage('You have been successfully logged out.');

      // Check if the token is gone, then prompt for login.
      // This makes it clear why we are re-triggering the login.
      const token = await getToken(context);
      if (!token) {
        await handleLogin(context);
      }
    }
  );
  context.subscriptions.push(logoutDisposable);

  const getArticleDisposable = vscode.commands.registerCommand(
    "streaming-extension.getArticles",
    async () => {
      const token = await ensureLoggedIn(context);
      if (!token) {
        vscode.window.showWarningMessage('Login is required to get articles.');
        return;
      }
      try {
        const response = await fetch(`${API_URL}/api/v1/articles`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!response.ok) {
          vscode.window.showErrorMessage('Failed to fetch articles');
          return;
        }
        const articlesResponse: any = await response.json();
        console.log("articles: ", articlesResponse?.data);
        vscode.window.showInformationMessage(`Articles: ${JSON.stringify(articlesResponse.data)}`);
      } catch (err: any) {
        vscode.window.showErrorMessage('Error: ' + err.message);
      }
    }
  );

  context.subscriptions.push(getArticleDisposable);
}

export function deactivate() {
  // Stop the HTTP server when extension deactivates
  stopFileWriteServer();
}
