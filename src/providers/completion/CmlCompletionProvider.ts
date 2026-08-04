import * as vscode from 'vscode';

export interface CmlTagSuggestion {
  label: string;
  detail: string;
  documentation: string;
  insertText: string;
}

export const cmlTagSuggestions: CmlTagSuggestion[] = [
  {
    label: 'label',
    detail: 'Define a navigation label',
    documentation: 'Cria um ponto de navegação dentro do arquivo.',
    insertText: 'label>$0</label>'
  },
  {
    label: 'desc',
    detail: 'Describe the previous label',
    documentation: 'Define uma descrição para a label imediatamente anterior.',
    insertText: 'desc>$0</desc>'
  },
  {
    label: 'span',
    detail: 'Mark a region of lines for a label',
    documentation: 'Marca um intervalo de linhas pertencente a uma label.',
    insertText: 'span>$0</span>'
  },
  {
    label: 'summary',
    detail: 'Describe a symbol',
    documentation: 'Descreve uma função, variável, classe ou outro símbolo.',
    insertText: 'summary>$0</summary>'
  },
  {
    label: 'param',
    detail: 'Describe a function parameter',
    documentation: 'Descreve um parâmetro de função usando o atributo name.',
    insertText: 'param name="name">$0</param>'
  },
  {
    label: 'return',
    detail: 'Describe the return value',
    documentation: 'Descreve o valor retornado por uma função.',
    insertText: 'return>$0</return>'
  },
  {
    label: 'note',
    detail: 'Add a note',
    documentation: 'Adiciona uma observação relevante.',
    insertText: 'note>$0</note>'
  },
  {
    label: 'warn',
    detail: 'Add a warning',
    documentation: 'Define um aviso para o desenvolvedor.',
    insertText: 'warn>$0</warn>'
  },
  {
    label: 'see',
    detail: 'Cross-reference another code element',
    documentation: 'Cria uma referência a outro símbolo, arquivo ou etiqueta CML.',
    insertText: 'see path="$0" />'
  },
  {
    label: 'seealso',
    detail: 'Suggest related references',
    documentation: 'Indica uma referência complementar relacionada.',
    insertText: 'seealso target="#$0" />'
  },
  {
    label: 'example',
    detail: 'Add an example snippet',
    documentation: 'Define um exemplo de uso para uma parte do código.',
    insertText: 'example lang="$1">$0</example>'
  },
  {
    label: 'since',
    detail: 'Document the introduction version',
    documentation: 'Indica a versão ou data de introdução de um trecho.',
    insertText: 'since>$0</since>'
  },
  {
    label: 'status',
    detail: 'Describe the current status',
    documentation: 'Representa o estado atual de uma parte do código.',
    insertText: 'status type="$0">$1</status>'
  },
  {
    label: 'exception',
    detail: 'Describe a specific exception',
    documentation: 'Descreve uma exceção específica.',
    insertText: 'exception named="Exception">$0</exception>'
  },
  {
    label: 'author',
    detail: 'Document the author',
    documentation: 'Descreve quem implementou ou mantém um trecho.',
    insertText: 'author>$0</author>'
  },
  {
    label: 'permission',
    detail: 'Document permissions',
    documentation: 'Define quem possui permissões de uso.',
    insertText: 'permission>$0</permission>'
  },
  {
    label: 'platform',
    detail: 'Document supported platforms',
    documentation: 'Indica a plataforma na qual uma parte do código é aplicável.',
    insertText: 'platform>$0</platform>'
  },
  {
    label: 'license',
    detail: 'Document the license',
    documentation: 'Define a licença usada pelo trecho.',
    insertText: 'license type="MIT">$0</license>'
  }
];

export function shouldSuggestCmlTag(linePrefix: string): boolean {
  return /(?:\/\/|\/\*|#|;|\(\*\))\s*<[^>]*$/.test(linePrefix);
}

export class CmlCompletionProvider implements vscode.CompletionItemProvider {
  provideCompletionItems(document: vscode.TextDocument, position: vscode.Position): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList> {
    const linePrefix = document.lineAt(position.line).text.slice(0, position.character);
    if (!shouldSuggestCmlTag(linePrefix)) {
      return [];
    }

    const prefix = linePrefix.match(/<([a-zA-Z-]*)$/)?.[1] ?? '';

    return cmlTagSuggestions
      .filter((tag) => tag.label.startsWith(prefix.toLowerCase()))
      .map((tag) => {
        const item = new vscode.CompletionItem(tag.label, vscode.CompletionItemKind.Snippet);
        item.insertText = new vscode.SnippetString(tag.insertText);
        item.detail = tag.detail;
        item.documentation = new vscode.MarkdownString(tag.documentation);
        item.sortText = `0${tag.label}`;
        return item;
      });
  }
}