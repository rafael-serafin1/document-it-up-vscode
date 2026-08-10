import * as vscode from 'vscode';
import { parseCmlLabels, CmlLabel } from '../CmlParser';

//<label>FOLDING</label>
//<desc>Provider responsável por registrar as regiões dobráveis das labels CML</desc>
//<span>

///<synopsis>Percorre a árvore de labels (incluindo filhas) e monta uma folding range para cada span encontrado, indo da linha da tag `label` até a linha do `span`.</synopsis>
///<note>Sem esse provider, o VS Code só reconhece o bloco de comentário contíguo (`label`, `desc`, `span`) como dobrável e ignora tudo que vem depois, já que o `span` pode estar várias linhas — e vários símbolos de código — abaixo.</note>
function buildFoldingRanges(labels: CmlLabel[]): vscode.FoldingRange[] {
  const ranges: vscode.FoldingRange[] = [];

  const visit = (label: CmlLabel) => {
    for (const span of label.spans) {
      if (span.endLine > label.range.start.line)
        ranges.push(new vscode.FoldingRange(label.range.start.line, span.endLine, vscode.FoldingRangeKind.Region));
    }

    for (const child of label.children)
      visit(child);
  };

  for (const label of labels)
    visit(label);

  return ranges;
}

export class CmlFoldingRangeProvider implements vscode.FoldingRangeProvider {
  provideFoldingRanges(document: vscode.TextDocument, _context: vscode.FoldingContext, _token: vscode.CancellationToken): vscode.FoldingRange[] {
    const labels = parseCmlLabels(document);
    return buildFoldingRanges(labels);
  }
}
//</span>