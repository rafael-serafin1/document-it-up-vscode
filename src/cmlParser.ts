import * as vscode from 'vscode';

//<label>INTERFACES</label>
//<desc>Interfaces responsáveis pelas tags span e label</desc>
//<span>
export interface CmlSpan {
  startLine: number;
  endLine: number;
  range: vscode.Range;
}

export interface CmlLabel {
  name: string;
  description?: string;
  range: vscode.Range;
  spans: CmlSpan[];
}
//</span>

//<label>PATTERNS</label>
//<desc>Moldes de reconhecimento usando Regex.</desc>
//<span>
const labelPattern = /<label>([^<]+)<\/label>/i;
const descPattern = /<desc>([^<]+)<\/desc>/i;
const spanOpenPattern = /<span>/i;
const spanClosePattern = /<\/span>/i;
//</span>


//<label>PARSER</label>
//<desc>Implementação do parser para reconhecimento das tags.</desc>
//<span>
export function parseCmlLabels(document: vscode.TextDocument): CmlLabel[] {
  const labels: CmlLabel[] = [];
  let currentLabel: CmlLabel | undefined;
  let currentSpan: CmlSpan | undefined;

  for (let lineIndex = 0; lineIndex < document.lineCount; lineIndex++) {
    const line = document.lineAt(lineIndex).text;

    const labelMatch = labelPattern.exec(line);
    if (labelMatch) {
      const name = labelMatch[1].trim();
      if (!name) {
        continue;
      }

      const range = new vscode.Range(
        new vscode.Position(lineIndex, line.indexOf(labelMatch[0])),
        new vscode.Position(lineIndex, line.indexOf(labelMatch[0]) + labelMatch[0].length)
      );

      currentLabel = { name, description: undefined, range, spans: [] };
      labels.push(currentLabel);
      currentSpan = undefined;
      continue;
    }

    if (currentLabel) {
      const descMatch = descPattern.exec(line);
      if (descMatch) {
        currentLabel.description = descMatch[1].trim();
        continue;
      }
    }

    if (spanOpenPattern.test(line) && currentLabel) {
      const startLine = lineIndex + 1;
      currentSpan = {
        startLine,
        endLine: Math.max(startLine, document.lineCount - 1),
        range: new vscode.Range(
          new vscode.Position(startLine, 0),
          new vscode.Position(Math.max(startLine, document.lineCount - 1), document.lineAt(Math.max(startLine, document.lineCount - 1)).text.length)
        ),
      };
      currentLabel.spans.push(currentSpan);
      continue;
    }

    if (spanClosePattern.test(line) && currentSpan) {
      const endLine = Math.max(currentSpan.startLine, lineIndex - 1);
      currentSpan.endLine = endLine;
      currentSpan.range = new vscode.Range(
        new vscode.Position(currentSpan.startLine, 0),
        new vscode.Position(endLine, document.lineAt(endLine).text.length)
      );
      currentSpan = undefined;
    }
  }

  return labels;
}
//</span>