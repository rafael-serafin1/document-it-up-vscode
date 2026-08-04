import * as vscode from 'vscode';
import { parseCmlLabels, CmlLabel } from './CmlParser';
import { CmlCompletionProvider } from './providers/CmlCompletionProvider';
import { AttributeCompletionProvider } from './providers/CmlAttributeCompletionProvider';
import { AttributeValueCompletionProvider } from './providers/CmlAttributeValuesCompletionProvider';
import { CmlHoverProvider } from './providers/CmlHoverProvider';
import { ShowLabels } from './navigation/CmlLabelNavigation';
import { ShowHierarchy } from './navigation/CmlLabelHierarchy';
import { SearchByAuthorsName } from './navigation/CmlAuthorSearch';

export interface CmlQuickPickItem extends vscode.QuickPickItem {
  labelData: CmlLabel;
}

//<label>CORPSE</label>
//<desc>Corpo da extensão</desc>
//<span>

//<summary>Ativa a extensão assim que abre o VSCode</summary>
export function activate(context: vscode.ExtensionContext) {
  //<summary>Show labels command application</summary>
  const showLabelsCommand = vscode.commands.registerCommand('cml.showLabels', async () => { ShowLabels(); });

  //<summary>Show hierarchy command application</summary>
  const showHierarchyCommand = vscode.commands.registerCommand('cml.showHierarchy', async () => { ShowHierarchy() });

  //<summary>Search authors command application</summary>
  const searchByAuthorCommand = vscode.commands.registerCommand('cml.searchByAuthor', async () => { await SearchByAuthorsName(); });

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

  context.subscriptions.push(showLabelsCommand, showHierarchyCommand, searchByAuthorCommand, tagCompletionProvider, attributeCompletionProvider, attributeValueCompletionProvider, hoverProvider);
}

export function deactivate() {}

//</span>