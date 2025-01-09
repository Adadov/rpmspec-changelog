import { window, OutputChannel, TaskDefinition, TaskProvider, Task, WorkspaceConfiguration, workspace, ShellExecution, TaskScope } from 'vscode';

const logs: OutputChannel = window.createOutputChannel("Mock", { log: true });

interface mockBuildTaskDefinition extends TaskDefinition {
  name: string;
  type: string;
  download: boolean;
}

export class mockBuildTaskProvider implements TaskProvider {
  static mockBuildScriptType = 'rpmbuild';
  private tasks: Task[] = [];
  private settings: WorkspaceConfiguration;

  constructor(private workspaceRoot: string) {
    this.settings = workspace.getConfiguration('rpmspecChangelog');
  }

  public async provideTasks(): Promise<Task[]> {
    return this.getTasks();
  }

  public resolveTask(_task: Task): Task | undefined {
    const name: string = _task.definition.name;
    if (name) {
      const definition: mockBuildTaskDefinition = <any>_task.definition;
      return this.getTask(definition);
    }

    return undefined;
  }

  // private getDefaultDefinition() {
  //   return {
  //     type: mockBuildTaskProvider.mockBuildScriptType,
  //     download: false,
  //     name: null
  //   };
  // }

  public static createDefinition(os: string) {
    return {
      type: mockBuildTaskProvider.mockBuildScriptType,
      download: false,
      name: os
    };
  }

  private getTasks(): Task[] {
    const settings = this.settings;

    this.tasks = [];

    let oses: string[] = settings.get("mockOses") ?? [];
    if (this.settings.get('debug')) {
      logs.appendLine("oses: " + oses.join(' '));
    }

    let definition: mockBuildTaskDefinition;
    if (oses!.length > 0) {
      let cmd = "";
      for (let i = 0; i < oses.length; i++) {
        let os = oses[i];
        const definition = mockBuildTaskProvider.createDefinition(os);
        let task: Task = this.getTask(definition) as Task;
        this.tasks!.push(task);

        if (settings.get('showAll')) {
          cmd += this.getTaskCmd(definition.name);
        }
      }

      if (settings.get('showAll')) {
        const termExec = new ShellExecution(cmd);
        const definition = mockBuildTaskProvider.createDefinition("all");
        const allTask = new Task(definition,
          TaskScope.Workspace,
          `run mock: all`,
          mockBuildTaskProvider.mockBuildScriptType,
          termExec);
        this.tasks!.push(allTask);
      }
    } else {
      let base = 41;
      definition = {
        type: mockBuildTaskProvider.mockBuildScriptType,
        name: "fedora" + base + "x86_64",
        download: false
      };
      let task = this.getTask(definition);
      if (task instanceof Task) {
        this.tasks!.push(task);
      }
    }

    return this.tasks;
  }

  private getTask(definition: mockBuildTaskDefinition): Task | undefined {
    if (!window.activeTextEditor?.document.fileName.endsWith(".spec")) {
      return undefined;
    }

    const config = definition.name;
    const cmd = this.getTaskCmd(config);

    if (this.settings.get('debug')) {
      logs.appendLine("CMD: " + cmd);
      logs.appendLine("OS: " + definition.os);
    }

    const termExec = new ShellExecution(cmd);
    return new Task(definition, TaskScope.Workspace, `Mock: ${config}`,
      mockBuildTaskProvider.mockBuildScriptType, termExec);
  }

  private getTaskCmd(config: string): string {
    // let sources = workspace.getWorkspaceFolder(window.activeTextEditor?.document.uri)
    let sources = "~/rpmbuild/SOURCES";
    let cmd: string = `cat $(mock -r ${config} --debug-config-expanded|awk '/config_file/ {print $3}'|tr -d "'") > tmp.cfg;`;

    try {
      const mockcfg = workspace.findFiles('mock.cfg').then((uri) => { console.log('uri', uri); });
      cmd += `cat mock.cfg >> tmp.cfg;`;
      if (this.settings.get('debug')) { logs.appendLine("mock.cfg found !!"); }
    } catch (e) {
      if (this.settings.get('debug')) { logs.appendLine("mock.cfg NOT found !!"); }
    }

    cmd += `echo "vers: ${config}"; mock -r tmp.cfg --spec ` + '${file}' + ` --sources ${sources} -D 'disable_source_fetch %nil';rm -f tmp.cfg;`;

    return cmd;

  }
}
