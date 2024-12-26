import * as vscode from 'vscode';
import { exec } from "child_process";
import { CustomBuildTaskProvider } from './customTaskProvider';

let customTaskProvider: vscode.Disposable | undefined;

export function activate(context: vscode.ExtensionContext) {
  const settings = vscode.workspace.getConfiguration('rpmspecChangelog');
  const workspaceRoot = (vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 0))
    ? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;
  if (!workspaceRoot) {
    return;
  }
  customTaskProvider = vscode.tasks.registerTaskProvider(CustomBuildTaskProvider.CustomBuildScriptType, new CustomBuildTaskProvider(workspaceRoot));

  let disposable = vscode.commands.registerTextEditorCommand(
    "extension.insertRPMSpecChangelog",
    async () => {
      const currentDocument = vscode.window.activeTextEditor;

      if (!currentDocument) {
        return;
      }
      const date = new Date(Date.now());
      // Results below assume UTC timezone - your results may vary

      const options: { [key: string]: any; } = {
        weekday: "short",
        month: "short",
        day: "2-digit",
        year: "numeric",
      };

      // Specify default date formatting for language (locale)
      const parts = new Intl.DateTimeFormat('en-us', options).formatToParts(date);
      const curdate = parts.filter((v) => { if (v.type !== 'literal') { return v.value; } }).map((v) => v.value).join(' ');

      console.log(curdate);
      console.log(settings.get('obtainNameAndEmailFromGit'));

      const snippet = new vscode.SnippetString("* " + curdate);

      var email, name;

      if (!settings.get('maintainerName')) {
        name = await new Promise(resolve => exec("/usr/bin/git config user.name", (_error, stdout: string) => {
          console.log(_error);
          console.log(stdout);
          resolve(stdout.trim());
        }));
      }
      else {
        name = settings.get('maintainerName');
      }

      if (!settings.get('maintainerEmail')) {
        email = await new Promise(resolve => exec("/usr/bin/git config user.email", (_error, stdout: string) => {
          console.log(stdout);
          resolve(stdout.trim());
        }));
      }
      else {
        email = settings.get('maintainerEmail');
      }

      console.log(name, email);
      snippet.appendText(` ${name} <${email}>`);

      const fullversion = await new Promise(resolve => exec(`rpmspec -P ${currentDocument.document.fileName} | awk '/^Version/ { ver=$2; } /^Release/ { gsub(/\.[a-z]+[0-9]+$/, "", $2); rel=$2; } END { printf("%s-%s", ver, rel); }'`, (error, stdout) => {
        resolve(stdout.trim());
      }));

      if (fullversion) {
        snippet.appendText(` - ${fullversion}`);
      }

      snippet.appendText("\n- ");
      snippet.appendTabstop();
      snippet.appendText("\n\n");
      currentDocument.insertSnippet(snippet);
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate(): void {
  if (customTaskProvider) {
    customTaskProvider.dispose();
  }
}
