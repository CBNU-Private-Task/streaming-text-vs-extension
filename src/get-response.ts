import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { sendRequest } from "./send-request";

export const getResponse = async () => {
  try {
    const workspaceFolders = vscode.workspace.workspaceFolders;

    if (!workspaceFolders) {
      return vscode.window.showErrorMessage(
        "Please open a project folder first"
      );
    }

    const workspaceFolder = workspaceFolders[0];
    const workspacePath = workspaceFolder.uri.fsPath;
    const userPrompt =
      "Write JavaScript code to have alert 6 times. Return ONLY the raw JavaScript code with proper syntax. Each JavaScript statement should be on its own line with correct semicolons and formatting. Ensure all code is valid and executable JavaScript. No explanations, no markdown, no code blocks. Stream the output line by line.";
    let streamingContent = "";
    let pendingLine = "";

    const jsFileName = "generated-code.js";
    const jsFilePath = path.join(workspacePath, jsFileName);
    await fs.promises.writeFile(
      jsFilePath,
      "// Generating JavaScript code...",
      "utf8"
    );
    const jsFileUri = vscode.Uri.file(jsFilePath);
    const jsDoc = await vscode.workspace.openTextDocument(jsFileUri);
    await vscode.window.showTextDocument(jsDoc);

    const aiResponse = await sendRequest(userPrompt, async (chunk: string) => {
      pendingLine += chunk;

      const lines = pendingLine.split("\n");

      pendingLine = lines.pop() || "";

      for (const line of lines) {
        streamingContent += line + "\n";
      }

      try {
        await fs.promises.writeFile(jsFilePath, streamingContent, "utf8");

        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (writeError) {
        console.error("Error updating streaming content:", writeError);
      }
    });

    if (pendingLine) {
      streamingContent += pendingLine;
      await fs.promises.writeFile(jsFilePath, streamingContent, "utf8");
    }

    if (!aiResponse) {
      return vscode.window.showErrorMessage("No response received from AI");
    }

    vscode.window.showInformationMessage(
      `AI Response code saved to: ${jsFileName}`
    );
  } catch (error) {
    console.error("Error in getResponse:", error);
    vscode.window.showErrorMessage("Error fetching AI response or saving file");
  }
};
