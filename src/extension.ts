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
import { format } from "date-fns";
import crypto from "crypto";

let fileHashes: any = {}; // To track file changes
let unsavedFiles = new Set(); // To track files with unsaved changes
let activityLog: string[] = []; // To log activities

// Function to calculate the hash of a document's content
function calculateHash(content: string) {
  return crypto.createHash("sha256").update(content).digest("hex");
}

function logEvent(content: string) {
  const TIME_FORMAT = "MM/dd/yyyy, hh:mm:ss a";
  const time = new Date().toISOString();
  console.log(`[${format(time, TIME_FORMAT)}]: ${content}`);
  activityLog.push(`[${format(time, TIME_FORMAT)}]: ${content}`);
}

function checkGitSchema(document: vscode.TextDocument): boolean {
  return document.uri.scheme === "git";
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  vscode.window.showInformationMessage("Git Repository Tracker Initialized");
  const TIME_FORMAT = "MM/dd/yyyy, hh:mm:ss a";

  // Start the repository creation process
  checkGitInstallaation()
    .then(() => getGitHubUsername())
    .then((username: string) => ensureGitHubRepository(username))
    .then(() => {
      console.log(">>>> Git Repo Initialized Successfully...");
      vscode.workspace.onDidSaveTextDocument((document) => {
        const filePath = document.fileName;
        const fileContent = document.getText();
        const fileHash = calculateHash(fileContent);
        console.log("Saved document name: ", filePath);
        console.log(
          "Saved document schema: ",
          document.uri.scheme,
          "Git: ",
          checkGitSchema(document)
        );

        if (fileHash !== fileHashes[filePath] && checkGitSchema(document)) {
          logEvent(`Saved with changes in ${filePath}`);
          fileHashes[filePath] = fileHash;
        }
      });

      vscode.window.onDidChangeActiveTextEditor((editor) => {
        if (editor) {
          const filePath = editor.document.fileName;
          console.log(`Focused on: ${filePath} ${editor.document.uri.scheme}`);
          if (checkGitSchema(editor.document)) {
            console.log("Loggging......");
            logEvent(`Focused on: ${filePath}`);
          }
        }
      });

      vscode.workspace.onDidOpenTextDocument((document) => {
        if (checkGitSchema(document)) {
          const filePath = document.fileName;
          console.log("Opened document: ", filePath);
          const fileContent = document.getText();
          const fileHash = calculateHash(fileContent);

          // Store the initial hash
          fileHashes[filePath] = fileHash;

          logEvent(`Focused on: ${filePath}`);
        }
      });

      vscode.workspace.textDocuments.forEach((document) => {
        if (checkGitSchema(document)) {
          const filePath = document.fileName;
          console.log("[gittracker] filename is: ", filePath);
          const fileContent = document.getText();
          const fileHash = calculateHash(fileContent);

          // Store the initial hash
          fileHashes[filePath] = fileHash;
        }
      });
    })
    .catch((error: any) => vscode.window.showErrorMessage(error.message));

  const disposable = vscode.commands.registerCommand(
    "gitraker.showActivity",
    () => {
      console.log("[gittracker] activities logs: ", activityLog);
    }
  );

  context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
