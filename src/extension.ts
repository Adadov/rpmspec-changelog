import { commands, workspace, ExtensionContext, window, OutputChannel, tasks, Disposable } from 'vscode';
import { insertChangelog } from "./insertChangelog";
import { mockBuildTaskProvider } from './mockTaskProvider';
import { quickInput } from './quickInput';

let mockTaskProvider: Disposable | undefined;
let insertChangelogCommand: Disposable | undefined;
let runMockCommand: Disposable | undefined;

const logs: OutputChannel = window.createOutputChannel("InsertChangelog");

export function activate(context: ExtensionContext) {
  const workspaceRoot = (workspace.workspaceFolders && (workspace.workspaceFolders.length > 0))
    ? workspace.workspaceFolders[0].uri.fsPath : undefined;

  if (!workspaceRoot) {
    return;
  }

  mockTaskProvider = tasks.registerTaskProvider(mockBuildTaskProvider.mockBuildScriptType, new mockBuildTaskProvider(workspaceRoot));
  runMockCommand = commands.registerCommand('rpmspecChangelog.runMock', quickInput, context);
  insertChangelogCommand = commands.registerTextEditorCommand("rpmspecChangelog.insertRPMSpecChangelog", insertChangelog);

  context.subscriptions.push(mockTaskProvider);
  context.subscriptions.push(runMockCommand);
  context.subscriptions.push(insertChangelogCommand);
}

export function deactivate(): void {
  if (runMockCommand) { runMockCommand.dispose(); }
  if (insertChangelogCommand) { insertChangelogCommand.dispose(); }
  if (mockTaskProvider) { mockTaskProvider.dispose(); }
}


