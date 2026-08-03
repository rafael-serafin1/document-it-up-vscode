import * as vscode from 'vscode';
import { parseCmlLabels, CmlLabel } from './CmlParser';
import { CmlCompletionProvider } from './providers/CmlCompletionProvider';
import { AttributeCompletionProvider } from './providers/CmlAttributeCompletionProvider';
import { AttributeValueCompletionProvider } from './providers/CmlAttributeValuesCompletionProvider';
import { CmlHoverProvider } from './providers/CmlHoverProvider';

interface CmlQuickPickItem extends vscode.QuickPickItem {
  labelData: CmlLabel;
}

//<label>CORPSE</label>
//<desc>Corpo da extensão</desc>
//<span>
//<summary>Ativa a extensão assim que abre o VSCode</summary>
export function activate(context: vscode.ExtensionContext) {
  const showLabelsCommand = vscode.commands.registerCommand('cml.showLabels', async () => { 
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

  const tagCompletionProvider = vscode.languages.registerCompletionItemProvider(
    [{ scheme: 'file' }, { scheme: 'untitled' }],
    new CmlCompletionProvider(),
    '<'
  );

  const attributeCompletionProvider = vscode.languages.registerCompletionItemProvider(
    [{ scheme: 'file' }, { scheme: 'untitled' }],
    new AttributeCompletionProvider(),
    ' ',
    '-'
  );

  const attributeValueCompletionProvider = vscode.languages.registerCompletionItemProvider(
    [{ scheme: 'file' }, { scheme: 'untitled' }],
    new AttributeValueCompletionProvider(),
    '"'
  );

  const hoverProvider = vscode.languages.registerHoverProvider(
    [{ scheme: 'file' }, { scheme: 'untitled' }],
    new CmlHoverProvider()
  );

  context.subscriptions.push(showLabelsCommand, tagCompletionProvider, attributeCompletionProvider, attributeValueCompletionProvider, hoverProvider);
}

//<author>Rafael Engel Serafin</author>
function buildQuickPickItem(label: CmlLabel): CmlQuickPickItem {
  const spanDescription = label.spans.length > 0
    ? `${label.spans.length} span${label.spans.length > 1 ? 's' : ''}`
    : 'No span detected';

  return {
    label: label.name,
    description: label.description ?? spanDescription,
    detail: label.spans.length > 0
      ? `Span detected at ${label.spans.map((span) => `${span.startLine + 1}-${span.endLine + 1}`).join(', ')}`
      : 'No span region detected.',
    labelData: label,
  };
}

function revealLabel(editor: vscode.TextEditor, label: CmlLabel) {
  editor.revealRange(label.range, vscode.TextEditorRevealType.InCenter);
  editor.selection = new vscode.Selection(label.range.start, label.range.end);
}

export function deactivate() {}
//</span>