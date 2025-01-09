import { commands, OutputChannel, workspace, window } from 'vscode';

const logs: OutputChannel = window.createOutputChannel("QuickInput", { log: true });
const settings = workspace.getConfiguration('rpmspecChangelog');

export function quickInput() {
  let oses: string[] = settings.get("mockOses") ?? [];

  if (settings.get('debug')) {
    oses.push('all');
  }

  const quickPick = window.createQuickPick();

  quickPick.items = oses.map(label => ({ label }));

  quickPick.onDidChangeSelection(selection => {
    if (selection[0]) {
      logs.appendLine(selection[0].label);
      runMock(selection[0].label)
        .then(() => quickPick.hide())
        .catch(console.error);
    }
    window.showInformationMessage(`Got: ${selection[0].label}`);
  });

  quickPick.onDidHide(() => quickPick.dispose());
  quickPick.show();
}

async function runMock(selection: string) {
  commands.executeCommand("workbench.action.tasks.runTask", `rpmbuild: Mock: ${selection}`);
}
