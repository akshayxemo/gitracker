// import { Octokit } from "@octokit/rest";
// import OctokitDefault from "@octokit/rest";
// const { Octokit } = OctokitDefault;

import { Octokit } from "@octokit/rest";
import { exec } from "child_process";
import * as vscode from "vscode";

export async function checkGitInstallaation(): Promise<void> {
  return new Promise((resolve, reject) => {
    exec("git --version", (error) => {
      if (error) {
        reject(new Error("Git is not installed on your system"));
      } else {
        resolve();
      }
    });
  });
}

export async function getGitHubUsername(): Promise<string> {
  return new Promise((resolve, reject) => {
    exec("git config user.name", (error, stdout) => {
      if (error || !stdout.trim()) {
        reject(
          new Error("Unable to retrive GitHub username. Please configure Git.")
        );
      } else {
        resolve(stdout.trim());
      }
    });
  });
}

export async function ensureGitHubRepository(username: string): Promise<void> {
  const repoName = `gitracker-${username}`;
  // const { Octokit } = await import("@octokit/rest");
  const config = vscode.workspace.getConfiguration("gitracker");

  console.log(
    "Inspecting gitracker.githubToken:",
    config.inspect("githubToken")
  );

  if (!config.inspect("githubToken")) {
    vscode.window.showErrorMessage(
      "Configuration 'gitracker.githubToken' is not registered."
    );
  } else {
    vscode.window.showInformationMessage("Configuration is registered!");
  }

  // Check if the token is already set
  let token = config.get<string>("githubToken");
  console.log("GitHub Token: ", token);
  console.log(
    "GitHub Token: ",
    vscode.workspace.getConfiguration("gitracker").has("githubToken")
  );
  console.log(
    vscode.workspace.getConfiguration().inspect("gitracker.githubToken")
  );

  if (!token) {
    // Prompt the user to enter the token
    token = await vscode.window.showInputBox({
      prompt: "Enter your GitHub Personal Access Token (PAT)",
      placeHolder: "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      ignoreFocusOut: true,
      password: true, // Mask the input for security
    });

    if (token) {
      // Save the token to the configuration
      try {
        await config.update(
          "githubToken",
          token,
          vscode.ConfigurationTarget.Global
        );
        vscode.window.showInformationMessage(
          "GitHub token saved successfully!"
        );
      } catch (error) {
        vscode.window.showErrorMessage(
          "Failed to save token. Please try again."
        );
        console.error(error);
      }
    } else {
      vscode.window.showErrorMessage(
        "No token entered. Some features may not work."
      );
    }
  } else {
    vscode.window.showInformationMessage(
      "GitHub token retrieved from configuration."
    );
    console.log("GitHub Token:", token); // For debugging purposes (don't log tokens in production)
  }

  const allSettings = vscode.workspace.getConfiguration();
  console.log("All registered settings:", allSettings);

  const octokit = new Octokit({
    auth: token,
  });

  try {
    await octokit.repos.get({ owner: username, repo: repoName });
    vscode.window.showInformationMessage(
      `Repository "${repoName}" already exist on GitHub.`
    );
  } catch (error: any) {
    if (error.status === 404) {
      await createGithubRepository(octokit, username, repoName);
    } else {
      throw new Error(`Failed to check repository: ${error.message}`);
    }
  }
}

async function createGithubRepository(
  octokit: Octokit,
  username: string,
  repoName: string
): Promise<void> {
  try {
    await octokit.repos.createForAuthenticatedUser({
      name: repoName,
      private: true,
    });

    vscode.window.showInformationMessage(
      `Repository "${repoName}" successfully created on Github.`
    );
  } catch (error: any) {
    throw new Error(`Failed to create repository: ${error.message}`);
  }
}