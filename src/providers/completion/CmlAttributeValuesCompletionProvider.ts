import * as vscode from 'vscode';

export interface AttributesDefinition {
  name: string;
  desc?: string;
  values?: string[];
}

export const seeAttr: AttributesDefinition[] = [
  {
    name: 'path',
    desc: 'Permite criar uma ponte até a parte do código desejada através de um Path/Relative Path'
  },
  {
    name: 'url',
    desc: 'Permite criar uma ponte até a parte do código desejada através de urls da web.'
  },
  {
    name: 'target',
    desc: 'Permite criar uma ponte até a parte do código desejada através do nome, desde que esteja no mesmo escopo.'
  }
];

export const licenseAttrs: string[] = [
  'MIT',
  'Apache 2.0',
  'BSD',
  'GNU GPL v3.0',
  'Mozilla Public License',
  'Eclipse Public License'
];

export const statusValues: string[] = [
  'deprecated',
  'bugged',
  'todo'
];

export const pinTypes: string[] = [
  'favorite',
  'important',
  'refactored',
  'caution',
  'reviewed',
  'optimization',
  'secured',
  'performatic'
];

export const priority: string[] = [
  'none',
  'low',
  'medium',
  'high',
  'urgent'
];

export class AttributeValueCompletionProvider implements vscode.CompletionItemProvider {
  private readonly attributeValues: Record<string, Record<string, string[]>> = {
    status: {
      type: statusValues
    },
    license: {
      type: licenseAttrs
    },
    pin: {
      as: pinTypes,
      by: [],
      priority: priority
    }
  };

  provideCompletionItems(document: vscode.TextDocument, position: vscode.Position): vscode.ProviderResult<vscode.CompletionItem[]> {
    const line = document.lineAt(position.line).text;
    const beforeCursor = line.substring(0, position.character);

    const tagMatch = beforeCursor.match(/<([a-zA-Z][\w-]*)[^>]*$/);
    const attributeMatch = beforeCursor.match(/\s([a-zA-Z][\w-]*)="[^"]*$/);

    if (!tagMatch || !attributeMatch) {
      return [];
    }

    const tagName = tagMatch[1].toLowerCase();
    const attributeName = attributeMatch[1].toLowerCase();
    const values = this.attributeValues[tagName]?.[attributeName];

    if (!values || values.length === 0) {
      return [];
    }

    return values.map((value) => {
      const item = new vscode.CompletionItem(value, vscode.CompletionItemKind.EnumMember);
      item.insertText = value;
      item.detail = `${attributeName} value`;
      item.documentation = new vscode.MarkdownString(`Valor sugerido para o atributo ${attributeName} da tag ${tagName}.`);
      return item;
    });
  }
}