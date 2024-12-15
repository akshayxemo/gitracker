// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import {
  checkGitInstallaation,
  getGitHubUsername,
  ensureGitHubRepository,
} from "./git";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  vscode.window.showInformationMessage("Git Repository Tracker Initialized");

  // Start the repository creation process
  checkGitInstallaation()
    .then(() => getGitHubUsername())
    .then((username: string) => ensureGitHubRepository(username))
    .catch((error: any) => vscode.window.showErrorMessage(error.message));
}

// This method is called when your extension is deactivated
export function deactivate() {}
