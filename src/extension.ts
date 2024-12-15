// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "gitraker" is now active!');

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  const disposable = vscode.commands.registerCommand(
    "gitraker.helloWorld",
    () => {
      // The code you place here will be executed every time your command is executed
      // Display a message box to the user
      vscode.window.showInformationMessage("Hello World from Gitracker!");
    }
  );

  const disposable2 = vscode.commands.registerCommand(
    "extension.showUI",
    () => {
      const panel = vscode.window.createWebviewPanel(
        "customUI", // Identifier
        "My Custom UI", // Title
        vscode.ViewColumn.One, // Editor column to show in
        { enableScripts: true } // Options
      );

      // HTML Content for the Webview
      panel.webview.html = getWebviewContent();

      // Handle messages from the webview
      panel.webview.onDidReceiveMessage(
        (message) => {
          switch (message.command) {
            case "alert":
              vscode.window.showInformationMessage(message.text);
              break;
          }
        },
        undefined,
        context.subscriptions
      );
    }
  );

  const provider = new CustomViewProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider("customView", provider)
  );

  vscode.workspace.onDidOpenTextDocument((document) => {
    const filePath = document.fileName;
    console.log("Current file path: >>>>>>>>>>> ", filePath);
    const folderPath = path.dirname(filePath);
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
    console.log("main folder path: ", folderPath);
    console.log(
      "main URI path: ",
      document.uri.scheme,
      document.uri.scheme === "git"
    );
    console.log("main Filename: ", document.fileName);
    console.log("workspcae: ", workspaceFolder);

    document.save();
    // if (workspaceFolder) {
    //   const workspaceRoot = workspaceFolder.uri.fsPath;
    //   console.log("workspace path: ", workspaceRoot);
    //   const gitFolder = findGitFolder(folderPath, workspaceRoot);
    //   if (gitFolder) {
    //     console.log(`Git folder found: ${gitFolder}`);
    //     // Start tracking activities here
    //   } else {
    //     console.log(`No Git folder found for file: ${filePath}`);
    //   }
    // } else {
    //   console.log("File is outside of any workspace. Skipping.");
    // }
  });

  context.subscriptions.push(disposable);
  context.subscriptions.push(disposable2);
}

function getWebviewContent(): string {
  return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Custom UI</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    padding: 10px;
                }
                button {
                    background: #007acc;
                    color: white;
                    padding: 10px;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                }
            </style>
        </head>
        <body>
            <h1>Hello, VS Code!</h1>
            <button onclick="sendMessage()">Click Me</button>
            <script>
                const vscode = acquireVsCodeApi();
                function sendMessage() {
                    vscode.postMessage({ command: 'alert', text: 'Button Clicked!' });
                }
            </script>
        </body>
        </html>
    `;
}

class CustomViewProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    // Set HTML content
    webviewView.webview.options = {
      enableScripts: true,
    };
    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    // Handle messages from the webview
    webviewView.webview.onDidReceiveMessage(
      (message) => {
        switch (message.command) {
          case "alert":
            vscode.window.showInformationMessage(message.text);
            break;
        }
      },
      undefined
      //   context.subscriptions
    );
  }

  private _getHtmlForWebview(webview: vscode.Webview): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>My Custom View</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 10px;
          }
          button {
            background: #007acc;
            color: white;
            padding: 10px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
          }
        </style>
      </head>
      <body>
        <h1>Hello from Explorer!</h1>
        <button id="alertButton">Click Me</button>
        <script>
          const vscode = acquireVsCodeApi();
          document.getElementById("alertButton").addEventListener("click", () => {
            vscode.postMessage({
              command: "alert",
              text: "Button clicked in Explorer view!",
            });
          });
        </script>
      </body>
      </html>
    `;
  }
}

function findGitFolder(
  folderPath: string,
  workspaceRoot: string
): string | null {
  let currentPath = folderPath;

  while (currentPath && currentPath !== path.dirname(currentPath)) {
    const gitPath = path.join(currentPath, ".git");
    console.log("git path: ", gitPath);
    if (fs.existsSync(gitPath) && fs.lstatSync(gitPath).isDirectory()) {
      return currentPath;
    }

    // Stop if we reach the workspace root
    if (currentPath === workspaceRoot) {
      break;
    }

    currentPath = path.dirname(currentPath); // Move up one level
  }
  return null; // no .git folder found
}

// This method is called when your extension is deactivated
export function deactivate() {}
