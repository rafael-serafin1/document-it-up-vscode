import * as vscode from 'vscode';
import { CmlLabel, parseCmlLabels } from '../../CmlParser';
import { buildQuickPickItem } from './CmlLabelNavigation';
import { CmlQuickPickLabelItem } from './interfaces/CmlNavigationInterfaces';
""
interface CmlHierarchyQuickPickItem extends CmlQuickPickLabelItem {
  document: vscode.TextDocument;
  uri: vscode.Uri;
  filePath: string;
}

interface CmlHierarchyLabel {
  label: CmlLabel;
  document: vscode.TextDocument;
  uri: vscode.Uri;
  filePath: string;
}

function buildHierarchyItem(item: CmlHierarchyLabel, path: CmlLabel[]): CmlHierarchyQuickPickItem {
  const quickPickItem = buildQuickPickItem(item.label) as CmlHierarchyQuickPickItem;
  const childrenLabel = item.label.children.length > 0 ? `(${item.label.children.length} child${item.label.children.length > 1 ? 'ren' : ''})` : '(leaf)';
  quickPickItem.description = `${childrenLabel} ${quickPickItem.description ?? ''}`.trim();
  quickPickItem.detail = path.length === 0
    ? `${quickPickItem.detail} — ${item.filePath}`
    : `Child of ${path[path.length - 1].name} — ${item.filePath}`;

  quickPickItem.document = item.document;
  quickPickItem.uri = item.uri;
  quickPickItem.filePath = item.filePath;
  quickPickItem.labelData = item.label;

  return quickPickItem;
}

async function revealLabel(document: vscode.TextDocument, label: CmlLabel) {
  const editor = await vscode.window.showTextDocument(document, { preview: false });  // later usage
  editor.revealRange(label.range, vscode.TextEditorRevealType.InCenter);
  editor.selection = new vscode.Selection(label.range.start, label.range.end);
}

export async function ShowHierarchy() {
  const workspaceFolders = vscode.workspace.workspaceFolders;

  if (!workspaceFolders) {
    vscode.window.showInformationMessage('Open a workspace with CML tags to display the label hierarchy.');
    return;
  }

  const searchFiles = await vscode.workspace.findFiles('**/*', '**/{node_modules,.git,out,dist}/**');
  const rootLabelItems: CmlHierarchyLabel[] = [];

  for (const file of searchFiles) {
    try {
      const document = await vscode.workspace.openTextDocument(file);

      const labels = parseCmlLabels(document);
      const rootLabels = labels.filter((label) => !label.parent);

      if (rootLabels.length === 0)
        continue;

      const relativePath = vscode.workspace.asRelativePath(file, false);
      for (const rootLabel of rootLabels) {
        rootLabelItems.push({
          label: rootLabel,
          document,
          uri: file,
          filePath: relativePath,
        });
      }
    } catch {
      continue;
    }
  }

  if (rootLabelItems.length === 0) {
    vscode.window.showInformationMessage('No CML root labels found in the workspace.');
    return;
  }

  const showHierarchyLevel = (levelItems: CmlHierarchyLabel[], path: CmlLabel[] = []) => {
    const quickPick = vscode.window.createQuickPick<CmlHierarchyQuickPickItem>();
    quickPick.placeholder = path.length === 0
      ? 'Select a parent label from workspace'
      : `Select a child label under ${path[path.length - 1].name}`;

    quickPick.items = levelItems.map((item) => buildHierarchyItem(item, path));

    quickPick.onDidAccept(() => {
      const selected = quickPick.selectedItems[0];
      if (!selected) {
        quickPick.dispose();
        return;
      }

      if (selected.labelData.children.length > 0) {
        quickPick.dispose();
        const nextItems = selected.labelData.children.map((child) => ({
          label: child,
          document: selected.document,
          uri: selected.uri,
          filePath: selected.filePath,
        }));
        showHierarchyLevel(nextItems, [...path, selected.labelData]);
        return;
      }

      revealLabel(selected.document, selected.labelData);
      quickPick.dispose();
    });

    quickPick.onDidHide(() => quickPick.dispose());
    quickPick.show();
  };

  showHierarchyLevel(rootLabelItems);
}