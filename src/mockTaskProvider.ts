import * as vs from 'vscode';
import { TaskDefinition, TaskProvider, Task, WorkspaceConfiguration, workspace, ShellExecution, TaskScope } from 'vscode';
import { logs as logging } from './extension';

interface mockBuildTaskDefinition extends TaskDefinition {
  name: string;
  type: string;
  download: boolean;
}

export class mockBuildTaskProvider implements TaskProvider {
  public static mockFile?: string;
  public static mockBuildScriptType = 'RPM';
  private tasks: Task[] = [];
  private settings?: WorkspaceConfiguration;
  private mockSettings?: WorkspaceConfiguration;

  constructor(private workspaceRoot: string) {
    const logs = logging
    const self = this;

    try {
      if (this.settings?.get('logDebug')) { logs.appendLine("mock.cfg found !!"); }
    } catch (e) {
      if (this.settings?.get('logDebug')) { logs.appendLine("mock.cfg NOT found !!"); }
    }

  }

  public async provideTasks(): Promise<Task[]> {
    const logs = logging
    logs.appendLine("Initialize mockBuildTaskProvider...");

    this.settings = vs.workspace.getConfiguration('rpmspecChangelog', null);
    this.mockSettings = vs.workspace.getConfiguration('mock', null);

    return this.getTasks();
  }

  public resolveTask(_task: Task): Task | undefined {
    const name: string = _task.definition.name;
    return this.getTasks().find((v) => v.name === name);
  }

  public static getTaskDisplayName(profil: string) {
    return `Mock: ${profil}`;
  }

  public static createDefinition(os: string) {
    return {
      type: mockBuildTaskProvider.mockBuildScriptType,
      download: false,
      name: os
    };
  }

  private getTasks(): Task[] {
    const logs = logging
    logs.appendLine("getTasks...");

    const settings = this.settings;

    this.tasks = [];

    let oses: string[] = this.mockSettings?.get("profils") as string[];

    // if (this.settings?.get('logDebug')) {
    //   logs.appendLine("oses: " + oses.join(' '));
    // }

    if (oses!.length > 0) {
      let cmd: string = "";
      for (let i = 0; i < oses.length; i++) {
        let os = oses[i];
        const definition = mockBuildTaskProvider.createDefinition(os);
        let task: Task = this.getTask(definition) as Task;
        this.tasks!.push(task);
      }
    } else {
      let version = 41;
      let task = this.getTask(mockBuildTaskProvider.createDefinition("fedora" + version + "x86_64"));
      if (task instanceof Task) {
        this.tasks!.push(task);
      }
    }

    return this.tasks;
  }

  private getTask(definition: mockBuildTaskDefinition): Task | undefined {
    const config = definition.name;
    const cmd = this.getTaskCmd(config);

    const termExec = new ShellExecution(cmd);
    return new Task(definition, TaskScope.Workspace, mockBuildTaskProvider.getTaskDisplayName(definition.name),
      mockBuildTaskProvider.mockBuildScriptType, termExec);
  }

  private getTaskCmd(config: string): string {
    const logs = logging
    // let sources = workspace.getWorkspaceFolder(window.activeTextEditor?.document.uri)
    let sources = "~/rpmbuild/SOURCES";
    let cmd: string = `cat $(mock -r ${config} --debug-config-expanded|awk '/config_file/ {print $3}'|tr -d "'") > tmp.cfg;`;
    if (mockBuildTaskProvider.mockFile !== null) {
      cmd += `cat ${mockBuildTaskProvider.mockFile} >> tmp.cfg;`;
    }

    cmd += `echo "vers: ${config}"; mock -r tmp.cfg --spec ` + '${file}' + ` --sources ${sources} -D 'disable_source_fetch %nil';rm -f tmp.cfg;`;

    return cmd;

  }
}
