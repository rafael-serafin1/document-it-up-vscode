import * as vscode from 'vscode';
import { parseCmlLabels, CmlLabel } from './CmlParser';
import { CmlCompletionProvider } from './providers/completion/CmlCompletionProvider';
import { AttributeCompletionProvider } from './providers/completion/CmlAttributeCompletionProvider';
import { AttributeValueCompletionProvider } from './providers/completion/CmlAttributeValuesCompletionProvider';
import { CmlHoverProvider } from './providers/CmlHoverProvider';
import { ShowLabels } from './navigation/CmlLabelNavigation';
import { ShowHierarchy } from './navigation/CmlLabelHierarchy';
import { SearchByAuthorsName } from './navigation/CmlAuthorSearch';
import { CmlNavigationProvider } from './containers/providers/CmlContainerProvider';
import { CmlViewContainer } from './containers/CmlContainer';
import { JumpToEntry } from './navigation/CmlJumpToEntry';
import { JumpToExit } from './navigation/CmlJumpToExit';

export interface CmlQuickPickItem extends vscode.QuickPickItem {
  labelData: CmlLabel;
}

//<label>CORPSE</label>
//<desc>Corpo da extensão</desc>
//<span>

//<summary>Ativa a extensão assim que abre o VSCode</summary>
//<entry>Função de entrada da extensão</entry>
export function activate(context: vscode.ExtensionContext) {
  //<summary>Show labels command application</summary>
  const showLabelsCommand = vscode.commands.registerCommand('cml.showLabels', async () => { ShowLabels(); });

  //<summary>Show hierarchy command application</summary>
  const showHierarchyCommand = vscode.commands.registerCommand('cml.showHierarchy', async () => { ShowHierarchy() });

  //<summary>Search authors command application</summary>
  const searchByAuthorCommand = vscode.commands.registerCommand('cml.searchByAuthor', async () => { await SearchByAuthorsName(); });

  //<summary>Jump to Entry</summary>
  const jumpToEntryCommand = vscode.commands.registerCommand('cml.jumpToEntry', async () => { await JumpToEntry(); });

  //<summary>Jump to Exit</summary>
  const jumpToExitCommand = vscode.commands.registerCommand('cml.jumpToExit', async () => { await JumpToExit(); })

  CmlViewContainer(context);

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

  //<summary>Colocar comandos aqui faz com que eles sejam dispostos como botões clicáveis na barra acima do mini mapa</summary>
  context.subscriptions.push(showLabelsCommand, showHierarchyCommand, searchByAuthorCommand, tagCompletionProvider, attributeCompletionProvider, attributeValueCompletionProvider, hoverProvider);
}

//<exit>Função de suspensão da extensão</exit>
export function deactivate() {}

//</span>