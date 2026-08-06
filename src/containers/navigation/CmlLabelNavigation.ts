import * as vscode from 'vscode';
import { CmlLabel, parseCmlLabels } from '../../CmlParser';
import { CmlQuickPickLabelItem } from './interfaces/CmlNavigationInterfaces';

//<label>QUICK_PICK_RELATED</label>
//<span>

//<synopsis>Build up quick pick item using label data</synopsis>
//<author contact="engelrafael03@gmail.com" repository="https://github.com/rafael-serafin1">Rafael Engel Serafin</author>
export function buildQuickPickItem(label: CmlLabel): CmlQuickPickLabelItem {
  const spanDescription = label.spans.length > 0
    ? `${label.spans.length} span${label.spans.length > 1 ? 's' : ''}`
    : 'No span detected';

  return {
    label: label.name,
    description: label.description ?? "No description",
    detail: label.spans.length > 0
      ? `Span detected at ${label.spans.map((span) => `${span.startLine + 1}-${span.endLine + 1}`).join(', ')}`
      : 'No span region detected.',
    labelData: label
  };
}

export function revealLabel(editor: vscode.TextEditor, label: CmlLabel) {
  editor.revealRange(label.range, vscode.TextEditorRevealType.InCenter);
  editor.selection = new vscode.Selection(label.range.start, label.range.end);
}
//</span>

export function ShowLabels() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showInformationMessage('Open a file with CML tags to display the labels.');
    return;
  }
  
  const labels = parseCmlLabels(editor.document);
  if (labels.length === 0) {
    vscode.window.showInformationMessage('No CML label found in the current file.');
    return;
  }

  const quickPick = vscode.window.createQuickPick<CmlQuickPickLabelItem>();

  quickPick.placeholder = 'Pick a label';
  quickPick.items = labels.map(buildQuickPickItem);

  quickPick.onDidAccept(() => {
    const selected = quickPick.selectedItems[0];
    if (selected) 
      revealLabel(editor, selected.labelData);
    quickPick.dispose();
  });

  quickPick.onDidHide(() => quickPick.dispose());
  quickPick.show();
}