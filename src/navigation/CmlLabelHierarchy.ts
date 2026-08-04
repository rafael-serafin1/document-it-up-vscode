import * as vscode from 'vscode';
import { CmlLabel, parseCmlLabels } from '../CmlParser';
import { buildQuickPickItem, CmlQuickPickItem, revealLabel } from './CmlLabelNavigation';

function buildHierarchyItem(label: CmlLabel, path: CmlLabel[]): CmlQuickPickItem {
  const item = buildQuickPickItem(label);
  const childrenLabel = label.children.length > 0 ? `(${label.children.length} child${label.children.length > 1 ? 'ren' : ''})` : '(leaf)';
  item.description = path.length === 0 ? `${childrenLabel} ${item.description ?? ''}`.trim() : `${childrenLabel} ${item.description ?? ''}`.trim();
  item.detail = path.length === 0
    ? 'Parent label'
    : `Child of ${path[path.length - 1].name}`;
  return item;
}

export function ShowHierarchy() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showInformationMessage('Open a file with CML tags to display the label hierarchy.');
    return;
  }

  const labels = parseCmlLabels(editor.document);
  if (labels.length === 0) {
    vscode.window.showInformationMessage('No CML labels found in the current file.');
    return;
  }

  const rootLabels = labels.filter((label) => !label.parent);
  if (rootLabels.length === 0) {
    vscode.window.showInformationMessage('No label hierarchy found in the current file.');
    return;
  }

  const showHierarchyLevel = (levelLabels: CmlLabel[], path: CmlLabel[] = []) => {
      const quickPick = vscode.window.createQuickPick<CmlQuickPickItem>();
      quickPick.placeholder = path.length === 0
        ? 'Select a parent label'
        : `Select a child label under ${path[path.length - 1].name}`;

      quickPick.items = levelLabels.map((label) => buildHierarchyItem(label, path));

      quickPick.onDidAccept(() => {
        const selected = quickPick.selectedItems[0];
        if (!selected) {
          quickPick.dispose();
          return;
        }

        if (selected.labelData.children.length > 0) {
          quickPick.dispose();
          showHierarchyLevel(selected.labelData.children, [...path, selected.labelData]);
          return;
        }

        revealLabel(editor, selected.labelData);
        quickPick.dispose();
      });

      quickPick.onDidHide(() => quickPick.dispose());
      quickPick.show();
  };

  showHierarchyLevel(rootLabels);
}