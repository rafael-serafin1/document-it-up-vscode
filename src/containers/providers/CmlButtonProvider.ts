import * as vscode from "vscode";

export class NavigationItem extends vscode.TreeItem {

    constructor(
        label: string,
        public readonly children: NavigationItem[] = [],
        command?: string,
        icon?: string
    ) {
        super(label, (children.length > 0) ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.None);

        if (command) 
            this.command = {
                command,
                title: label
            };

        if (icon)
            this.iconPath = new vscode.ThemeIcon(icon);

        this.contextValue = (children.length > 0) ? "group" : "command";
    }
}