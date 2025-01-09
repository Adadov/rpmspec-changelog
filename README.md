# RPMSpec Snippets & Mock build

Automaticaly Inserts a properly formatted changelog line to your RPM spec file for you.

## Features

-   name and email in changelog, can be specified manually or taken from `git`
-   Automaticaly detect `%changelog` to insert new entry
-   Evaluates macros in `Version` and `Release` using `rpmspec`
-   Run mock directly from vscode
-   Can customize mock configuration by adding a mock.cfg file in the workspaceFolder

## Requirements

You should have `git` and `rpmspec` in your PATH.
This is not required, but the changelog will be missing some information.
