import * as vscode from 'vscode';
import { CmlAuthor } from './providers/interfaces/CmlInterfaces';
import { CmlHoverProvider } from './providers/CmlHoverProvider';

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
  parent?: CmlLabel;
  children: CmlLabel[];
}

export interface CmlAuthorParsed {
  name: string;
  contact?: string;
  repository?: string;
  range: vscode.Range;
  lineNumber: number;
}
//</span>

//<label>PATTERNS</label>
//<desc>Moldes de reconhecimento usando Regex.</desc>
//<span>
const labelPattern = /<label>([^<]+)<\/label>/i;
const descPattern = /<desc>([^<]+)<\/desc>/i;
const spanOpenPattern = /<span>/i;
const spanClosePattern = /<\/span>/i;

const authorPattern = /<author\s*([^>]*)>([^<]+)<\/author>/i;
const authorAttrsPattern = /(contact|repository)\s*=\s*"([^"]+)"/gi;
//</span>


//<label>HELPERS</label>
//<desc>Funções de ajuda para o parser</desc>
//<span>

///<summary>Verifica se a tag está dentro dos limites do comentário.</summary>
function getCommentContent(line: string): string | undefined {
  const trimmed = line.trim();

  // //
  if (trimmed.startsWith("//"))
    return trimmed.substring(2).trim();

  if (trimmed.startsWith("/*") && trimmed.endsWith("*/"))
    return trimmed.substring(2, -2).trim();

  // #
  if (trimmed.startsWith("#"))
    return trimmed.substring(1).trim();

  // ;
  if (trimmed.startsWith(";"))
    return trimmed.substring(1).trim();

  // *
  if (trimmed.startsWith("*"))
    return trimmed.substring(1).trim();

  // (* *)
  if (trimmed.startsWith("(*") && trimmed.endsWith("*)"))
    return trimmed.slice(2, -2).trim();

  return undefined;
}
//</span>

//<label>PARSER</label>
//<desc>Implementação do parser para reconhecimento das tags.</desc>
//<span>

export function parseCmlLabels(document: vscode.TextDocument): CmlLabel[] {
  const labels: CmlLabel[] = [];
  let currentLabel: CmlLabel | undefined;

  const openLabelStack: CmlLabel[] = [];
  const openSpanStack: Array<{ label: CmlLabel; span: CmlSpan }> = [];

  for (let lineIndex = 0; lineIndex < document.lineCount; lineIndex++) {
    const line = document.lineAt(lineIndex).text;
    const comment = getCommentContent(line);

    if (!comment)
      continue;

    const labelMatch = labelPattern.exec(line);
    if (labelMatch) {
      const name = labelMatch[1].trim();
      if (!name)
        continue;

      const labelRange = new vscode.Range(
        new vscode.Position(lineIndex, line.indexOf(labelMatch[0])),
        new vscode.Position(lineIndex, line.indexOf(labelMatch[0]) + labelMatch[0].length)
      );

      currentLabel = { name, description: undefined, range: labelRange, spans: [], children: [] };
      labels.push(currentLabel);

      const parentLabel = openLabelStack[openLabelStack.length - 1];
      if (parentLabel) {
        currentLabel.parent = parentLabel;
        parentLabel.children.push(currentLabel);
      }

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
      const span = {
        startLine,
        endLine: Math.max(startLine, document.lineCount - 1),
        range: new vscode.Range(
          new vscode.Position(startLine, 0),
          new vscode.Position(Math.max(startLine, document.lineCount - 1), document.lineAt(Math.max(startLine, document.lineCount - 1)).text.length)
        ),
      };

      currentLabel.spans.push(span);
      openLabelStack.push(currentLabel);
      openSpanStack.push({ label: currentLabel, span });
      continue;
    }

    if (spanClosePattern.test(line) && openSpanStack.length > 0) {
      const activeSpan = openSpanStack.pop();
      if (!activeSpan)
        continue;

      const endLine = Math.max(activeSpan.span.startLine, lineIndex - 1);
      activeSpan.span.endLine = endLine;
      activeSpan.span.range = new vscode.Range(
        new vscode.Position(activeSpan.span.startLine, 0),
        new vscode.Position(endLine, document.lineAt(endLine).text.length)
      );

      if (openLabelStack[openLabelStack.length - 1] === activeSpan.label) {
        openLabelStack.pop();
      }
    }
  }

  return labels;
}

export function parseCmlAuthors(document: vscode.TextDocument): CmlAuthorParsed[] {
  const authors: CmlAuthorParsed[] = [];

  for (let lineIndex = 0; lineIndex < document.lineCount; lineIndex++) {
    const line = document.lineAt(lineIndex).text;
    const comment = getCommentContent(line);

    if (!comment)
      continue;

    const authorMatch = line.match(/<author\b([^>]*)>(.*?)<\/author>/i);
    if (!authorMatch)
      continue;

    const name = (authorMatch[2] || '').trim();
    if (!name)
      continue;

    const tagText = authorMatch[0];
    const startCharacter = line.indexOf(tagText);
    const authorRange = new vscode.Range(
      new vscode.Position(lineIndex, startCharacter),
      new vscode.Position(lineIndex, startCharacter + tagText.length)
    );

    const attrs = CmlHoverProvider.parseAttributes(authorMatch[1] || '');

    authors.push({
      name,
      contact: attrs.contact,
      repository: attrs.repository,
      range: authorRange,
      lineNumber: lineIndex + 1,
    });
  }

  return authors;
}
//</span>