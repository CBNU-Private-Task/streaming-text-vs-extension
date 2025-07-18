import * as vscode from "vscode";

const API_URL = "http://localhost:8000";

export async function promptForCredentials() {
  const email = await vscode.window.showInputBox({
    prompt: "Enter your Email",
    placeHolder: "Enter your Emai",
  });

  if (!email) {
    return null;
  }

  const password = await vscode.window.showInputBox({
    prompt: "Enter your password",
    placeHolder: "Enter your password",
  });

  if (!password) {
    return null;
  }

  return {
    email: email,
    password: password,
  };
}

export async function handleLogin(context: vscode.ExtensionContext) {
  while (true) {
    try {
      const creds = await promptForCredentials();
      if (!creds) {
        vscode.window.showWarningMessage('Login cancelled. You must log in to proceed.');
        await ensureLoggedIn(context);
        return;
      }
      const result = await loginUser(API_URL, creds.email, creds.password);
      const token = (result as any).access_token || (result as any).token;
      await storeToken(context, token);
      vscode.window.showInformationMessage('Login successful!');
      break; 
    } catch (error: any) {
      vscode.window.showErrorMessage('Login failed: ' + error.message + '. Please try again.');
     
    }
  }
}

export async function loginUser(url: string, email: string, password: string) {
    const userLogin = {
        email: email,
        password: password,
    }
    const response = await fetch("http://localhost:8000/api/v1/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(userLogin),
    });

    if (!response.ok) {
        let errorMessage = 'Invalid credentials or server error';
        try {
            const errorData = await response.json();
            errorMessage = (errorData as any).detail || errorMessage;
        } catch (e) {
            // Ignore if the error response has no JSON body
        }
        throw new Error(errorMessage);
    }

    return await response.json();
}

export async function ensureLoggedIn(context: vscode.ExtensionContext): Promise<string | undefined> {
    let token = await getToken(context);
    if (!token) {
      await handleLogin(context);
      token = await getToken(context);
    }
    return token;
  }

export async function storeToken(context: vscode.ExtensionContext, token: string) {
    await context.secrets.store('api-token', token);
}

export async function getToken(context: vscode.ExtensionContext) {
  return await context.secrets.get('api-token');
}

export async function deleteToken(context: vscode.ExtensionContext) {
  await context.secrets.delete('api-token');
}


