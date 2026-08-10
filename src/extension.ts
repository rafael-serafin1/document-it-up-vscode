import * as vscode from 'vscode';
import { parseCmlLabels, CmlLabel } from './CmlParser';
import { CmlCompletionProvider } from './providers/completion/CmlCompletionProvider';
import { AttributeCompletionProvider } from './providers/completion/CmlAttributeCompletionProvider';
import { AttributeValueCompletionProvider } from './providers/completion/CmlAttributeValuesCompletionProvider';
import { CmlHoverProvider } from './providers/CmlHoverProvider';
import { ShowLabels } from './containers/navigation/CmlLabelNavigation';
import { ShowHierarchy } from './containers/navigation/CmlLabelHierarchy';
import { SearchByAuthorsName } from './containers/documentation/CmlAuthorSearch';
import { CmlNavigationProvider } from './containers/providers/CmlContainerProvider';
import { CmlViewContainer } from './containers/CmlContainer';
import { JumpToEntry } from './containers/documentation/CmlJumpToEntry';
import { JumpToExit } from './containers/documentation/CmlJumpToExit';
import { CmlFoldingRangeProvider } from './classes/CmlFolding';

export interface CmlQuickPickItem extends vscode.QuickPickItem {
  labelData: CmlLabel;
}

//<label>CORPSE</label>
//<desc>Corpo da extensão</desc>
//<span>

//<synopsis>Ativa a extensão assim que abre o VS Code</synopsis>
//<entry>Função de entrada da extensão</entry>
export function activate(context: vscode.ExtensionContext) {
//<label>REGISTRO_DE_COMANDOS</label>
//<desc>Registra todos os comandos pelo id definido em package.json</desc>
//<span>

  //<synopsis>Show labels command application</synopsis>
  const showLabelsCommand = vscode.commands.registerCommand('cml.showLabels', async () => { ShowLabels(); });

  //<synopsis>Show hierarchy command application</synopsis>
  const showHierarchyCommand = vscode.commands.registerCommand('cml.showHierarchy', async () => { ShowHierarchy() });

  //<synopsis>Search authors command application</synopsis>
  const searchByAuthorCommand = vscode.commands.registerCommand('cml.searchByAuthor', async () => { await SearchByAuthorsName(); });

  //<synopsis>Jump to Entry</synopsis>
  const jumpToEntryCommand = vscode.commands.registerCommand('cml.jumpToEntry', async () => { await JumpToEntry(); });

  //<synopsis>Jump to Exit</synopsis>
  const jumpToExitCommand = vscode.commands.registerCommand('cml.jumpToExit', async () => { await JumpToExit(); })

//</span>

//<label>REGISTRO_DE_VIEW_CONTAINER</label>
//<desc>Registra um botão da barra lateral (a mesma que fica o Explorer, Search, Source Control, etc), chamado de View Container</desc>
//<span>

CmlViewContainer(context);
 
// </span>

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

  const foldingRangeProvider = vscode.languages.registerFoldingRangeProvider(
    [{ scheme: 'file' }, { scheme: 'untitled' }],
    new CmlFoldingRangeProvider()
  );

  //<synopsis>Colocar comandos aqui faz com que eles sejam dispostos como botões clicáveis na barra acima do mini mapa</synopsis>
  context.subscriptions.push(
    showLabelsCommand,
    showHierarchyCommand,
    searchByAuthorCommand,
    jumpToEntryCommand,
    jumpToExitCommand,
    tagCompletionProvider,
    attributeCompletionProvider,
    attributeValueCompletionProvider,
    hoverProvider,
    foldingRangeProvider
  );
}

//<synopsis>Função responsável pela desativação da extensão.</synopsis>
//<note>Mesmo que não tenha código dentro, sua declaração ainda é necessária.</note>
//<warn>Se você remover, vai gerar erro no funcionamento da extensão. Talvez nem se quer seja possível compilar sem essa função.</warn>
//<exit>Função de suspensão da extensão</exit>
export function deactivate() {}

//</span>