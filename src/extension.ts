import * as vscode from 'vscode';
import { parseCmlLabels, CmlLabel } from './cmlParser';

interface CmlQuickPickItem extends vscode.QuickPickItem {
  labelData: CmlLabel;
}

//<label>CORPSE</label>
//<span>
export function activate(context: vscode.ExtensionContext) {
  const showLabelsCommand = vscode.commands.registerCommand('cml.showLabels', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showInformationMessage('Abra um arquivo com tags CML para exibir as labels.');
      return;
    }

    const labels = parseCmlLabels(editor.document);
    if (labels.length === 0) {
      vscode.window.showInformationMessage('Nenhuma label CML encontrada no arquivo atual.');
      return;
    }

    const quickPick = vscode.window.createQuickPick<CmlQuickPickItem>();
    quickPick.placeholder = 'Pickup a label';
    quickPick.items = labels.map(buildQuickPickItem);

    quickPick.onDidAccept(() => {
      const selected = quickPick.selectedItems[0];
      if (selected) {
        revealLabel(editor, selected.labelData);
      }
      quickPick.dispose();
    });

    quickPick.onDidHide(() => quickPick.dispose());
    quickPick.show();
  });

  context.subscriptions.push(showLabelsCommand);
}

function buildQuickPickItem(label: CmlLabel): CmlQuickPickItem {
  const spanDescription = label.spans.length > 0
    ? `${label.spans.length} span${label.spans.length > 1 ? 's' : ''}`
    : 'Sem span';

  return {
    label: label.name,
    description: label.description ?? spanDescription,
    detail: label.spans.length > 0
      ? `Span detectado nas linhas ${label.spans.map((span) => `${span.startLine + 1}-${span.endLine + 1}`).join(', ')}`
      : 'Nenhuma região <span> detectada.',
    labelData: label,
  };
}

function revealLabel(editor: vscode.TextEditor, label: CmlLabel) {
  editor.revealRange(label.range, vscode.TextEditorRevealType.InCenter);
  editor.selection = new vscode.Selection(label.range.start, label.range.end);
}

export function deactivate() {}
//</span>