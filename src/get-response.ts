import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import * as http from "http";
import * as os from "os";
import { sendRequest } from "./send-request";

let httpServer: http.Server | null = null;
let serverPort: number = 0;

export const startFileWriteServer = () => {
  if (httpServer) {
    console.log(`Server already running on port ${serverPort}`);
    return serverPort; 
  }
  
  try {
    httpServer = http.createServer((req, res) => {
      
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      res.setHeader('Content-Type', 'application/json');
      
      if (req.method === 'OPTIONS') {
        res.statusCode = 200;
        res.end();
        return;
      }
      
      if (req.method === 'GET' && req.url === '/health') {
        res.statusCode = 200;
        res.end(JSON.stringify({ 
          status: "healthy", 
          server: "vscode-extension",
          port: serverPort,
          timestamp: new Date().toISOString()
        }));
        return;
      }
      
      if (req.method === 'POST' && req.url === '/write-file') {
        let body = '';
        
        req.on('data', chunk => {
          body += chunk.toString();
        });
        
        req.on('end', async () => {
          try {
            const data = JSON.parse(body);
          
            await writeAIResponseToFile(data.prompt, data.content);
            
            res.statusCode = 200;
            res.end(JSON.stringify({ 
              success: true, 
              message: "File written successfully",
              timestamp: new Date().toISOString()
            }));
            
          } catch (error) {
            console.error("Error processing request:", error);
            res.statusCode = 500;
            res.end(JSON.stringify({ 
              error: error instanceof Error ? error.message : 'Unknown error',
              timestamp: new Date().toISOString()
            }));
          }
        });
      } else {
        res.statusCode = 404;
        res.end(JSON.stringify({ error: "Not found" }));
      }
    });

    // Listen on any available port
    httpServer.listen(0, '127.0.0.1', () => {
      const address = httpServer?.address();
      if (address && typeof address === 'object') {
        serverPort = address.port;
        
        writePortConfig(serverPort);
        
        console.log(`✅ VS Code server running on port ${serverPort}`);
        vscode.window.showInformationMessage(`✅ Server started on port ${serverPort}!`);
      }
    });
    
    httpServer.on('error', (error: any) => {
      console.error('❌ Server error:', error);
      vscode.window.showErrorMessage(`Server error: ${error.message}`);
      cleanupPortConfig();
    });
    
  } catch (error) {
    console.error('❌ Failed to create server:', error);
    cleanupPortConfig();
  }
  
  return serverPort;
};

function writePortConfig(port: number) {
  try {
    const configDir = path.join(os.homedir(), '.vscode-streaming-extension');
    const configPath = path.join(configDir, 'server-config.json');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    
    const config = {
      port: port,
      timestamp: new Date().toISOString(),
      pid: process.pid,
      status: "running"
    };
    
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log(`✅ Port config written to: ${configPath}`);
    
  } catch (error) {
    console.error('❌ Failed to write port config:', error);
  }
}

function cleanupPortConfig() {
  try {
    const configPath = path.join(os.homedir(), '.vscode-streaming-extension', 'server-config.json');
    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath);
      console.log('✅ Port config cleaned up');
    }
  } catch (error) {
    console.error('❌ Failed to cleanup port config:', error);
  }
}

export const stopFileWriteServer = () => {
  if (httpServer) {
    console.log("Stopping file write server");
    httpServer.close();
    httpServer = null;
    serverPort = 0;
    cleanupPortConfig();
    vscode.window.showInformationMessage('File write server stopped');
  }
};

const writeAIResponseToFile = async (prompt: string, content: string) => {
  try {
    
    const workspaceFolders = vscode.workspace.workspaceFolders;

    if (!workspaceFolders) {
      const errorMsg = "Please open a project folder first";
      console.error(errorMsg);
      vscode.window.showErrorMessage(errorMsg);
      return;
    }

    const workspaceFolder = workspaceFolders[0];
    const workspacePath = workspaceFolder.uri.fsPath;
    
    // Create filename based on timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const jsFileName = `ai-generated-${timestamp}.js`;
    const jsFilePath = path.join(workspacePath, jsFileName);

    // Write content to file
    await fs.promises.writeFile(jsFilePath, content, "utf8");
    
    // Open file in VS Code
    const jsFileUri = vscode.Uri.file(jsFilePath);
    const jsDoc = await vscode.workspace.openTextDocument(jsFileUri);
    await vscode.window.showTextDocument(jsDoc);

    const successMsg = `AI response written to: ${jsFileName}`;
    vscode.window.showInformationMessage(successMsg);

  } catch (error) {
    console.error("Error writing AI response to file:", error);
    vscode.window.showErrorMessage(`Error writing AI response to file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error; 
  }
};

// Original getResponse function (for manual VS Code command)
export const getResponse = async () => {
  try {
    const workspaceFolders = vscode.workspace.workspaceFolders;

    if (!workspaceFolders) {
      return vscode.window.showErrorMessage(
        "Please open a project folder first"
      );
    }

    // Get user input
    const userPrompt = await vscode.window.showInputBox({
      prompt: "Enter your prompt for AI code generation",
      placeHolder: "e.g., Write a function to sort an array",
    });

    if (!userPrompt) {
      return vscode.window.showInformationMessage("No prompt provided");
    }

    const workspaceFolder = workspaceFolders[0];
    const workspacePath = workspaceFolder.uri.fsPath;
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
