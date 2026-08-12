import * as vscode from 'vscode';
import { CmlPin, parseCmlPinTag } from '../../CmlParser';
import { CmlPinQuickPickItem, PinSearchResult } from './interfaces/CmlDocumentationInterfaces';

//<label>QUICK_PICK_RELATED</label>
//<span>
function buildPinsWorkQuickPick(pin: CmlPin): CmlPinQuickPickItem {
    if (!pin) 
        return {
            label: `ERROR - 404`,
            description: `Couldn't find this specific pin`,
            detail: 'Not found',
            pinData: pin
        };

    const label = pin.as?.toUpperCase() ?? 'Not Specified';
    const priority = pin.priority ? `(${pin.priority.toUpperCase()})` : `none`;
    let details = `by ${pin.by}`;

    return {
        label: `${label} - ${priority}`,
        description: `Range ${pin.range.start.line} - ${pin.range.end.line}`,
        detail: details,
        pinData: pin
    };
}

export function revealPins(editor: vscode.TextEditor, pin: CmlPin) {
  editor.revealRange(pin.range, vscode.TextEditorRevealType.InCenter);
  editor.selection = new vscode.Selection(pin.range.start, pin.range.end);
}
//</span>

export async function SearchByPriorityPin(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showInformationMessage('Open a file with CML tags to display the pins.');
        return;
    }

    const pins = parseCmlPinTag(editor.document);
    if (pins.length == 0) {
        vscode.window.showInformationMessage('No CML pin found in the current file.');
        return;
    }

    const input = vscode.window.createInputBox();
    input.title = 'Search pins by priority';
    input.placeholder = "Enter pins priority value";
    input.prompt = 'Search for pins by it value across the current open file';
    input.show();

    input.onDidAccept(async () => {
        const query = input.value.trim().toLowerCase();
        input.dispose();
    
        if (!query)
            return;
    
        const filteredPins = pins.filter((entry) => entry.priority?.toLowerCase().includes(query));
    
        if (filteredPins.length === 0) {
            vscode.window.showInformationMessage('No pins priority matched your search.');
            return;
        }
    
        const quickPick = vscode.window.createQuickPick<CmlPinQuickPickItem>();
        quickPick.placeholder = 'Select an pin entry';
        quickPick.items = filteredPins.map(buildPinsWorkQuickPick);
    
        quickPick.onDidAccept(async () => {
            const selected = quickPick.selectedItems[0];
            if (selected)
                await revealPins(editor, selected.pinData);
            quickPick.dispose();
        });
    
        quickPick.onDidHide(() => quickPick.dispose());
        quickPick.show();
    });

    input.onDidHide(async () => input.dispose());
}