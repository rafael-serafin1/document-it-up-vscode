//<label foldable>FOLDING</label>
//<desc>Funções responsáveis por aplicar o fold nas labels marcadas com o atributo `foldable`</desc>
//<span>

//<synopsis>Percorre a árvore de labels (incluindo filhas) e retorna apenas as marcadas como foldable e que possuam um span associado.</synopsis>
function collectFoldableFunctions(labels: CmlLabel[]): CmlLabel[] {
  const foldable: CmlLabel[] = [];

  const visit = (label: CmlLabel) => {
    if (label.foldable && label.spans.length > 0)
      foldable.push(label);

    for (const child of label.children)
      visit(child);
  }

  for (const label of labels)
    visit(label);

  return foldable;
}

async function foldedLabels(editor: vscode.TextEditor, labels: CmlLabel[]): Promise<number[]> {
  const foldableLabels = collectFoldableFunctions(labels);
 
  if (foldableLabels.length === 0)
    return [];
 
  await vscode.commands.executeCommand('vscode.executeFoldingRangeProvider', editor.document.uri);

  const selectionLines = foldableLabels.map(label => label.range.start.line); 

  return selectionLines;
}

//<synopsis>Aplica o fold do editor em todas as labels foldable de um documento, usando a linha de abertura de cada span como ponto de dobra.</synopsis>
//<param name="editor">Editor de texto ativo onde o fold será aplicado.</param>
//<param name="labels">Lista de labels (com hierarquia) já resultante de `parseCmlLabels`.</param>
export async function applyCmlFolding(editor: vscode.TextEditor, labels: CmlLabel[]): Promise<void> {
  const collection = await foldedLabels(editor, labels);
  await vscode.commands.executeCommand('editor.fold', { collection });
}

///<synopsis>Desfaz o fold aplicado nas labels foldable de um documento, restaurando os spans à visualização expandida.</synopsis>
///<param name="editor">Editor de texto ativo onde o unfold será aplicado.</param>
///<param name="labels">Lista de labels (com hierarquia) já resultante de `parseCmlLabels`.</param>
export async function removeCmlFolding(editor: vscode.TextEditor, labels: CmlLabel[]): Promise<void> {
  const collection = await foldedLabels(editor, labels);
  await vscode.commands.executeCommand('editor.unfold', { collection });
}

//</span>