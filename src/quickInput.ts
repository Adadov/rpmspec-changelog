import * as vs from 'vscode';
import { commands, window, QuickInput, Event } from 'vscode';
import { mockBuildTaskProvider } from './mockTaskProvider';
import { logs } from './extension';

const settings = vs.workspace.getConfiguration('mock');

export function quickInput() {
  const oses: string[] = settings.get("profils") ?? [];

  if (settings.get('showAllProfils')) {
    oses.push('all');
  }

  const quickPick = window.createQuickPick();

  quickPick.items = oses.map(label => ({ label }));

  quickPick.onDidChangeSelection(selection => {
    if (selection[0]) {

      runMock(selection[0].label)
        .then(() => {
          return quickPick.hide();
        })
        .catch(console.error);
    }
  });

  quickPick.onDidHide(() => quickPick.dispose());
  quickPick.show();
}

async function runMock(selection: string) {
  if (selection === 'all') {

    logs.appendLine('Running for all profils');
    const oses: string[] = settings.get("profils") ?? [];

    for (let i = 0; i < oses.length; i++) {
      const taskName = mockBuildTaskProvider.getTaskDisplayName(oses[i])
      commands.executeCommand("workbench.action.tasks.runTask", `${mockBuildTaskProvider.mockBuildScriptType}: ${taskName}`);
    }
  } else {
    logs.appendLine('Running for profil '+selection);
    const taskName = mockBuildTaskProvider.getTaskDisplayName(selection)
    commands.executeCommand("workbench.action.tasks.runTask", `${mockBuildTaskProvider.mockBuildScriptType}: ${taskName}`);
  }
}

export class mockQuickInput implements QuickInput {
  title: string | undefined;
  step: number | undefined;
  totalSteps: number | undefined;
  enabled: boolean = true;
  busy: boolean = false;
  ignoreFocusOut: boolean = true;
  onDidHide!: Event<void>;
  show(): void {
    throw new Error('Method not implemented.');
  }
  hide(): void {
    throw new Error('Method not implemented.');
  }
  dispose(): void {
    throw new Error('Method not implemented.');
  }
}
