import * as vscode from 'vscode';
import { CmlQuickPickEntryItem, EntrySearchResult } from '../documentation/interfaces/CmlDocumentationInterfaces';
import { parseCmlEntryTag } from '../../CmlParser';
import { CmlEntry } from '../../providers/interfaces/CmlInterfaces';

function buildQuickPickEntryItem(entry: EntrySearchResult): CmlQuickPickEntryItem {
    return {
        label: `${(entry.entry) ? entry.entry.lang.toUpperCase() : "Found this"} Entry`,
        description: (entry.entry) ? entry.entry.desc : "No Description",
        detail: `Located at ${entry.filePath} >> ${entry.lineNumber}`,
        entryData: entry
    };
}

async function revealEntry(entry: EntrySearchResult) {
    const document = await vscode.workspace.openTextDocument(entry.uri);
    const editor = await vscode.window.showTextDocument(document, { preview: false });
    const range = new vscode.Range(entry.range.start, entry.range.end);

    editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
    editor.selection = new vscode.Selection(range.start, range.end);    
}

export async function JumpToEntry() {
    const workspaceFolders = vscode.workspace.workspaceFolders;

    if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showInformationMessage('Open a workspace folder to search authors.');
        return;
    }

    const searchFiles = await vscode.workspace.findFiles('**/*', '**/{node_modules,.git,out,dist}/**');
    const entry_tags: EntrySearchResult[] = [];

    for (const file of searchFiles) {
        try {
            const document = await vscode.workspace.openTextDocument(file);
            const parsedEntryTags = parseCmlEntryTag(document);
            
            for (const entry of parsedEntryTags) {
                entry_tags.push({
                    entry: {
                        desc: entry.desc ?? "No description",
                        lang: entry.lang
                    },
                    range: entry.range,
                    uri: file,
                    filePath: vscode.workspace.asRelativePath(file, false),
                    lineNumber: entry.lineNumber
                });
            }
        } catch {
            continue;
        }
    }

    if (entry_tags.length === 0) {
        vscode.window.showInformationMessage('No documented entry was found in the workspace.');
        return;
    }

    const quickPicker = vscode.window.createQuickPick<CmlQuickPickEntryItem>();
    quickPicker.title = 'Jump to a Entry';
    quickPicker.placeholder = 'Choose a Entry to Jump';
    quickPicker.prompt = 'Search for Entries and jump to them';
    quickPicker.items = entry_tags.map(buildQuickPickEntryItem);

    quickPicker.onDidAccept(async () => {
        const selected = quickPicker.selectedItems[0];
        if (selected)
            await revealEntry(selected.entryData);
        quickPicker.dispose();
    });

    quickPicker.onDidHide(() => quickPicker.dispose());
    quickPicker.show();
}