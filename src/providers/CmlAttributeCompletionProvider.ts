import * as vscode from 'vscode';
import { AttributesDefinition, licenseAttrs, seeAttr } from './CmlAttributeValuesCompletionProvider';

const cmlTagAttribute: Record<string, AttributesDefinition[]> = {
  param: [
    {
        name: "name",
        desc: "Descreve o nome do parâmetro, se tiver"
    }
  ],
  see: seeAttr,
  seealso: seeAttr,
  status: [
    {
      name: 'deprecated',
      desc: 'Define o estado como sendo uma função marcada para descarte.'
    },
    {
      name: 'bugged',
      desc: 'Define o estado como sendo de mal funcionamento.'
    },
    {
      name: 'todo',
      desc: 'Define o estado como sendo a fazer.'
    }
  ],
  exception: [
    {
      name: 'named',
      desc: 'Define o nome da exceção.'
    }
  ],
  author: [
    {
      name: 'contact',
      desc: 'Define um meio de contato com o autor. Pode ser email, número de telefone, etc.'
    },
    {
      name: 'repository',
      desc: 'Define uma url para o perfil de repositórios do autor.'
    }
  ],
  license: [
    {
      name: 'type',
      desc: 'Define o tipo de licença usado.',
      values: licenseAttrs
    }
  ]
};

export class AttributeCompletionProvider implements vscode.CompletionItemProvider {
  provideCompletionItems(document: vscode.TextDocument, position: vscode.Position): vscode.ProviderResult<vscode.CompletionItem[]> {
    const line = document.lineAt(position.line).text;
    const beforeCursor = line.substring(0, position.character);

    const tagMatch = beforeCursor.match(/<([a-zA-Z][\w-]*)[^>]*$/);
    if (!tagMatch) {
      return [];
    }

    const tagName = tagMatch[1].toLowerCase();
    const attributes = cmlTagAttribute[tagName];
    if (!attributes) {
      return [];
    }

    const partialMatch = beforeCursor.match(/\s([\w-]*)$/);
    const partial = partialMatch?.[1] ?? '';

    return attributes
      .filter((attr) => attr.name.toLowerCase().startsWith(partial.toLowerCase()))
      .map((attr) => {
        const item = new vscode.CompletionItem(attr.name, vscode.CompletionItemKind.Property);
        item.insertText = new vscode.SnippetString(`${attr.name}="$1"`);
        item.detail = `${tagName} attribute`;
        item.documentation = new vscode.MarkdownString(attr.desc ?? '');

        if (attr.values && attr.values.length > 0) {
          item.command = {
            command: 'editor.action.triggerSuggest',
            title: 'Suggest Values'
          };
        }

        return item;
      });
  }
}