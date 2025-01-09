import * as vs from 'vscode';
import { commands, workspace, ExtensionContext, window, OutputChannel, tasks, Disposable } from 'vscode';
import { insertChangelog } from "./insertChangelog";
import { mockBuildTaskProvider } from './mockTaskProvider';
import { quickInput } from './quickInput';

let mockTaskProvider: Disposable | undefined;
let insertChangelogCommand: Disposable | undefined;
let runMockCommand: Disposable | undefined;

export const logs: OutputChannel = window.createOutputChannel("RPMSpec Snippets", { log: true });

logs.appendLine("RPMSpec loaded");
logs.show(true);

export function activate(context: ExtensionContext) {
  logs.appendLine("Extension activation ...");
  const workspaceRoot = (vs.workspace.workspaceFolders && (vs.workspace.workspaceFolders.length > 0))
    ? vs.workspace.workspaceFolders[0].uri.fsPath : undefined;

  if (!workspaceRoot) {
    console.log(workspace)
    return;
  }

  let promise = workspace.findFiles('mock.cfg');
  promise.then((uri) => { if (uri.length > 0) { return mockBuildTaskProvider.mockFile = uri[0].path; } });

  mockTaskProvider = tasks.registerTaskProvider(mockBuildTaskProvider.mockBuildScriptType, new mockBuildTaskProvider(workspaceRoot));
  context.subscriptions.push(mockTaskProvider);
  logs.appendLine("mockTaskProvider added ...");

  runMockCommand = commands.registerCommand('rpmspecChangelog.runMock', quickInput, context);
  context.subscriptions.push(runMockCommand);
  logs.appendLine("runMockCommand added ...");

  insertChangelogCommand = commands.registerTextEditorCommand("rpmspecChangelog.insertRPMSpecChangelog", insertChangelog);
  context.subscriptions.push(insertChangelogCommand);
  logs.appendLine("insertChangelogCommand added ...");

}

export function deactivate(): void {
  if (runMockCommand) { runMockCommand.dispose(); }
  if (insertChangelogCommand) { insertChangelogCommand.dispose(); }
  if (mockTaskProvider) { mockTaskProvider.dispose(); }
}


