import * as vscode from 'vscode';
import { parseCmlExitTag } from '../../CmlParser';
import { CmlQuickPickExitItem, ExitSearchResult } from './interfaces/CmlDocumentationInterfaces';

function buildQuickPickExitItem(exit: ExitSearchResult): CmlQuickPickExitItem {
    return {
        label: `${(exit.exit) ? exit.exit.lang.toUpperCase() : "Found this"} exit`,
        description: (exit.exit) ? exit.exit.desc : "No Description",
        detail: `Located at ${exit.filePath} >> ${exit.lineNumber}`,
        exitData: exit
    };
}

async function revealExit(exit: ExitSearchResult) {
    const document = await vscode.workspace.openTextDocument(exit.uri);
    const editor = await vscode.window.showTextDocument(document, { preview: false });
    const range = new vscode.Range(exit.range.start, exit.range.end);

    editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
    editor.selection = new vscode.Selection(range.start, range.end);    
}

export async function JumpToExit() {
    const workspaceFolders = vscode.workspace.workspaceFolders;

    if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showInformationMessage('Open a workspace folder to search authors.');
        return;
    }

    const searchFiles = await vscode.workspace.findFiles('**/*', '**/{node_modules,.git,out,dist}/**');
    const exit_tags: ExitSearchResult[] = [];

    for (const file of searchFiles) {
        try {
            const document = await vscode.workspace.openTextDocument(file);
            const parsedExitTags = parseCmlExitTag(document);
            
            for (const exit of parsedExitTags) {
                exit_tags.push({
                    exit: {
                        desc: exit.desc ?? "No description",
                        lang: exit.lang
                    },
                    range: exit.range,
                    uri: file,
                    filePath: vscode.workspace.asRelativePath(file, false),
                    lineNumber: exit.lineNumber
                });
            }
        } catch {
            continue;
        }
    }

    if (exit_tags.length === 0) {
        vscode.window.showInformationMessage('No documented exit was found in the workspace.');
        return;
    }

    const quickPicker = vscode.window.createQuickPick<CmlQuickPickExitItem>();
    quickPicker.title = 'Jump to a Exit';
    quickPicker.placeholder = 'Choose a exit to Jump';
    quickPicker.prompt = 'Search for Exits and jump to them';
    quickPicker.items = exit_tags.map(buildQuickPickExitItem);

    quickPicker.onDidAccept(async () => {
        const selected = quickPicker.selectedItems[0];
        if (selected)
            await revealExit(selected.exitData);
        quickPicker.dispose();
    });

    quickPicker.onDidHide(() => quickPicker.dispose());
    quickPicker.show();
}