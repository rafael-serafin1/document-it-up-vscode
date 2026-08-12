import * as vscode from 'vscode';
import { CmlAuthor } from './providers/interfaces/CmlInterfaces';
import { CmlHoverProvider } from './providers/CmlHoverProvider';
import { CmlAuthorParsed, CmlEntryTagParsed, CmlExitTagParsed } from './interfaces/CmlParseInterfaces';

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
  foldable?: boolean;
  spans: CmlSpan[];
  parent?: CmlLabel;
  children: CmlLabel[];
}

export interface CmlPin {
  as?: string;
  by: string;
  priority?: 'none' | 'low' | 'medium' | 'high' | 'urgent';
  range: vscode.Range;
  lineNumber: number;
}
//</span>

//<label>PATTERNS</label>
//<desc>Moldes de reconhecimento usando Regex.</desc>
//<span>
const labelPattern = /<label(\s+[^>]*)?>([^<]+)<\/label>/i;
const labelFoldableAttrPattern = /\bfoldable\b/i;
const descPattern = /<desc>([^<]+)<\/desc>/i;
const spanOpenPattern = /<span>/i;
const spanClosePattern = /<\/span>/i;

const pinTagRegex = /<pin\b([^>]*)\/>/i;
const attributeRegex = /\b(as|by|priority)\s*=\s*"([^"]*)"/gi;
//</span>


//<label>HELPERS</label>
//<desc>Funções de ajuda para o parser</desc>
//<span>

///<synopsis>Verifica se a tag está dentro dos limites do comentário.</synopsis>
function getCommentContent(line: string): string | undefined {
  const trimmed = line.trim();

  if (trimmed.startsWith("//"))
    return trimmed.slice(2).trim();

  if (trimmed.startsWith("/*") && trimmed.endsWith("*/"))
    return trimmed.slice(2, -2).trim();

  if (trimmed.startsWith("#"))
    return trimmed.slice(1).trim();

  if (trimmed.startsWith(";"))
    return trimmed.slice(1).trim();

  if (trimmed.startsWith("*"))
    return trimmed.slice(1).trim();

  if (trimmed.startsWith("(*") && trimmed.endsWith("*)"))
    return trimmed.slice(2, -2).trim();

  if (trimmed.startsWith("<!--") && trimmed.endsWith("-->"))
    return trimmed.slice(4, -3).trim();

  return undefined;
}

function getCommentInline(line: string): string | undefined {
  let quote: '"' | "'" | '`' | undefined = undefined;
  let escaped = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    // em caso esteja dentro da string
    if (quote) {
      if (escaped) {
        escaped = false;
        continue;
      }

      if (char === "\\") {
        escaped = true;
        continue;
      }

      if (char === quote) {
        quote = undefined;
      }

      continue;
    }

    // início de string
    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      continue;
    }

    // //
    if (char === "/" && line[i + 1] === "/") {
      return line.slice(i + 2).trim();
    }

    // /* */
    if (char === "/" && line[i + 1] === "*") {
      const end = line.indexOf("*/", i + 2);

      if (end === -1)
        return line.slice(i + 2).trim();

      return line.slice(i + 2, end).trim();
    }

    // <!-- -->
    if (line.startsWith("<!--", i)) {
      const end = line.indexOf("-->", i + 4);

      if (end === -1)
        return line.slice(i + 4).trim();

      return line.slice(i + 4, end).trim();
    }

    // (* *)
    if (char === "(" && line[i + 1] === "*") {
      const end = line.indexOf("*)", i + 2);

      if (end === -1)
        return line.slice(i + 2).trim();

      return line.slice(i + 2, end).trim();
    }
  }

  return undefined;
}
//</span>

//<label>PARSERS</label>
//<desc>Implementação do parser para reconhecimento das tags.</desc>
//<span>

//<synopsis>Parseia as 'labels'</synopsis>
export function parseCmlLabels(document: vscode.TextDocument): CmlLabel[] {
  const labels: CmlLabel[] = [];
  let currentLabel: CmlLabel | undefined;

  const openLabelStack: CmlLabel[] = [];
  const openSpanStack: Array<{ label: CmlLabel; span: CmlSpan }> = [];

  for (let lineIndex = 0; lineIndex < document.lineCount; ++lineIndex) {
    const line = document.lineAt(lineIndex).text;
    const comment = getCommentContent(line);

    if (!comment)
      continue;

    const labelMatch = labelPattern.exec(comment);
    if (labelMatch) {
      const name = labelMatch[2].trim();
      if (!name)
        continue;

      const attrsText = labelMatch[1] || '';
      const foldable = labelFoldableAttrPattern.test(attrsText);
      
      const labelRange = new vscode.Range(
        new vscode.Position(lineIndex, line.indexOf(labelMatch[0])),
        new vscode.Position(lineIndex, line.indexOf(labelMatch[0]) + labelMatch[0].length)
      );

      currentLabel = { name, description: undefined, range: labelRange, foldable, spans: [], children: [] };
      labels.push(currentLabel);

      const parentLabel = openLabelStack[openLabelStack.length - 1];
      if (parentLabel) {
        currentLabel.parent = parentLabel;
        parentLabel.children.push(currentLabel);
      }

      continue;
    }

    if (currentLabel) {
      const descMatch = descPattern.exec(comment);
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

    if (spanClosePattern.test(comment) && openSpanStack.length > 0) {
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


//<label>ENTRY_EXIT</label>
//<desc>Parsers das tags 'entry' e 'exit'</desc>
//<span>

export function parseCmlEntryTag(document: vscode.TextDocument): CmlEntryTagParsed[] {
  const entryTags: CmlEntryTagParsed[] = [];

  for (let lineIndex = 0; lineIndex < document.lineCount; lineIndex++) {
    const line = document.lineAt(lineIndex).text;
    const comment = getCommentContent(line);

    if (!comment)
      continue;

    const entryMatch = line.match(/<entry>(.*?)<\/entry>/i);
    if (!entryMatch)
      continue;

    const desc = (entryMatch[1] || '').trim();
    if (!desc)
      continue;

    const tagText = entryMatch[0];
    const startCharacter = line.indexOf(tagText);
    const entryRange = new vscode.Range(
      new vscode.Position(lineIndex, startCharacter),
      new vscode.Position(lineIndex, startCharacter + tagText.length)
    );

    entryTags.push({
      desc,
      lang: document.languageId,
      range: entryRange,
      lineNumber: lineIndex + 1,
    });
  }

  return entryTags;
}

export function parseCmlExitTag(document: vscode.TextDocument): CmlExitTagParsed[] {
  const exitTags: CmlExitTagParsed[] = [];

  for (let lineIndex = 0; lineIndex < document.lineCount; lineIndex++) {
    const line = document.lineAt(lineIndex).text;
    const comment = getCommentContent(line);

    if (!comment)
      continue;

    const exitMatch = comment.match(/<exit>(.*?)<\/exit>/i);
    if (!exitMatch)
      continue;

    const desc = (exitMatch[1] || '').trim();
    if (!desc)
      continue;

    const tagText = exitMatch[0];
    const startCharacter = line.indexOf(tagText);
    const entryRange = new vscode.Range(
      new vscode.Position(lineIndex, startCharacter),
      new vscode.Position(lineIndex, startCharacter + tagText.length)
    );

    exitTags.push({
      desc,
      lang: document.languageId,
      range: entryRange,
      lineNumber: lineIndex + 1,
    });
  }

  return exitTags;
}
//</span>

//<synopsis>Parseia todas as tags 'pins' de um arquivo</synopsis>
export function parseCmlPinTag(document: vscode.TextDocument): CmlPin[] {
  const pins: CmlPin[] = [];

  for (let lineIndex = 0; lineIndex < document.lineCount; ++lineIndex) {
    const line = document.lineAt(lineIndex).text;
    const comment = getCommentInline(line);

    if (!comment)
      continue;

    const pinsMatch = comment.match(pinTagRegex);

    if (!pinsMatch)
      continue;

    const attributes: Record<string, string> = { };
    
    for (const match of pinsMatch[1].matchAll(attributeRegex))
      attributes[match[1]] = match[2];

    const startCharacter = comment.indexOf(pinsMatch[0]);
    const range = new vscode.Range(
      new vscode.Position(lineIndex, startCharacter),
      new vscode.Position(lineIndex, startCharacter + pinsMatch[0].length)
    );

    /// se a prioridade for 'undefined', então deve ser automaticamente 'none'
    const priority = attributes.priority as 'none' | 'low' | 'medium' | 'high' | 'urgent';    
    
    pins.push({
      as: attributes.as,
      by: attributes.by,
      priority: priority ?? 'none',
      range,
      lineNumber: lineIndex + 1
    });
  }

  return pins;
}

//</span>
