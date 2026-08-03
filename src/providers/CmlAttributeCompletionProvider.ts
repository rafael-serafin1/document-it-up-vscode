import * as vscode from "vscode";

export interface AttributesDefinition {
    name: string;
    desc?: string;
    values?: string[];
}

export const seeAttr: AttributesDefinition[] = [
    {
        name: "path",
        desc: "Permite criar uma ponte até a parte do código desejada através de um Path/Relative Path"
    },
    {
        name: "url",
        desc: "Permite criar uma ponte até a parte do código desejada através de urls da web."
    },
    {
        name: "target",
        desc: "Permite criar uma ponte até a parte do código desejada através do nome, desde que esteja no mesmo escopo. "
    }
];

const cmlTagAttribute: Record<string, AttributesDefinition[]> = {
    see: seeAttr,
    seealso: seeAttr,
    status: [
        {
            name: "deprecated",
            desc: "Define o estado como sendo uma função marcada para descarte."
        },
        {
            name: "bugged",
            desc: "Define o estado como sendo de mal funcionamento."
        },
        {
            name: "todo",
            desc: "Define o estado como sendo a fazer."
        }
    ],
    exception: [
        {
            name: "named",
            desc: "Define o nome da exceção."
        }
    ],
    author: [
        {
            name: "contact",
            desc: ""
        },
        {
            name: "",
            desc: ""
        }
    ],
    license: [
        {
            name: "type",
            desc: "Define o tipo de licença usado.",
            values: [
                "MIT",
                "Apache 2.0",
                "BSD",
                "GNU GPL v3.0",
                "Mozilla Public License",
                "Eclipse Public License"
            ]
        }
    ]
}

export class AttributeCompletionProvider
    implements vscode.CompletionItemProvider {

    provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position
    ): vscode.CompletionItem[] {

        const line = document.lineAt(position.line).text;
        const beforeCursor = line.substring(0, position.character);

        const tagMatch = beforeCursor.match(/<\??([a-zA-Z][\w-]*)[^>]*$/);

        if (!tagMatch) {
            return [];
        }

        const tagName = tagMatch[1];

        const attributes = cmlTagAttribute[tagName];

        if (!attributes) {
            return [];
        }

        const partialMatch = beforeCursor.match(/\s([\w-]*)$/);

        const partial = partialMatch?.[1] ?? "";

        return attributes
            .filter(attr =>
                attr.name.startsWith(partial)
            )
            .map(attr => {

                const item = new vscode.CompletionItem(
                    attr.name,
                    vscode.CompletionItemKind.Property
                );

                item.insertText = new vscode.SnippetString(
                    `${attr.name}="$1"`
                );

                item.detail = `${tagName} attribute`;

                item.command = {
                    command: "editor.action.triggerSuggest",
                    title: "Suggest Values"
                };

                return item;
            });
    }
}