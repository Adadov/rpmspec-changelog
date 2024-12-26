/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as path from 'path';
import * as vscode from 'vscode';

interface CustomBuildTaskDefinition extends vscode.TaskDefinition {

}

export class CustomBuildTaskProvider implements vscode.TaskProvider {
  static CustomBuildScriptType = 'custombuildscript';
  private tasks?: vscode.Task[];

  // We use a CustomExecution task when state needs to be shared across runs of the task or when
  // the task requires use of some VS Code API to run.
  // If you don't need to share state between runs and if you don't need to execute VS Code API in your task,
  // then a simple ShellExecution or ProcessExecution should be enough.
  // Since our build has this shared state, the CustomExecution is used below.
  private sharedState: string | undefined;

  private definition = {
    type: CustomBuildTaskProvider.CustomBuildScriptType
  };

  constructor(private workspaceRoot: string) { }

  public async provideTasks(): Promise<vscode.Task[]> {
    return this.getTasks();
  }

  public resolveTask(_task: vscode.Task): vscode.Task | undefined {
    return _task;
  }

  private getTasks(): vscode.Task[] {
    // // In our fictional build, we have two build flavors
    // const flavors: string[] = ['32', '64'];
    // // Each flavor can have some options.
    // const flags: string[][] = [['watch', 'incremental'], ['incremental'], []];

    this.tasks = [];
    // flavors.forEach(flavor => {
    //   flags.forEach(flagGroup => {
    this.tasks!.push(this.getTask("40"));
    this.tasks!.push(this.getTask("41"));
    //   });
    // });
    return this.tasks;
  }

  private getTask(fversion: string): vscode.Task {

    const termExec = new vscode.ShellExecution(`echo "vers: ${fversion}"; mock -r fedora-${fversion}-x86_64 --spec ` + '${file}' + ` --sources ~/rpmbuild/SOURCES '-D disable_source_fetch %nil'`);
    return new vscode.Task(this.definition, vscode.TaskScope.Workspace, `run mock fedora ${fversion} `,
      CustomBuildTaskProvider.CustomBuildScriptType, termExec);
    // return new vscode.Task(definition, vscode.TaskScope.Workspace, `run mock fedora 41`,
    //   CustomBuildTaskProvider.CustomBuildScriptType, new vscode.ShellExecution(async (): Promise<vscode.Pseudoterminal> => {
    //     // When the task is executed, this callback will run. Here, we setup for running the task.
    //     return new CustomBuildTaskTerminal(this.workspaceRoot, () => this.sharedState, (state: string) => this.sharedState = state);
    //   }));
  }
}
;
