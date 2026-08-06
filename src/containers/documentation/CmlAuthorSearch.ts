import * as vscode from 'vscode';
import { parseCmlAuthors } from '../../CmlParser';
import { CmlHoverProvider } from '../../providers/CmlHoverProvider';
import { CmlAuthorQuickPickItem, AuthorSearchResult } from './interfaces/CmlDocumentationInterfaces';

function buildAuthorsWorkQuickPick(author: AuthorSearchResult): CmlAuthorQuickPickItem {
    const label = author.author?.name ?? 'Anonymous Author';
    const symbolSuffix = author.symbolType ? `(${author.symbolType.toUpperCase()})` : ``;
    let details = "";

    if (author.author?.contact)
        details += `contact: ${author.author.contact}`;
    if (author.author?.contact && author.author.repository)
        details += " -- ";
    if (author.author?.repository)
        details += `repository: ${author.author.repository}`;

    return {
        label: `${label} ${symbolSuffix}`,
        description: `${author.filePath} >> Line ${author.lineNumber}`,
        detail: details,
        authorData: author,
    };
}

async function revealAuthorsWork(entry: AuthorSearchResult) {
    const document = await vscode.workspace.openTextDocument(entry.uri);
    const editor = await vscode.window.showTextDocument(document, { preview: false });
    const range = new vscode.Range(entry.range.start, entry.range.end);

    editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
    editor.selection = new vscode.Selection(range.start, range.end);
}

export async function SearchByAuthorsName() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showInformationMessage('Open a workspace folder to search authors.');
        return;
    }

    const searchFiles = await vscode.workspace.findFiles('**/*', '**/{node_modules,.git,out,dist}/**');
    const authors: AuthorSearchResult[] = [];

    for (const file of searchFiles) {
        try {
            const document = await vscode.workspace.openTextDocument(file);
            const parsedAuthors = parseCmlAuthors(document);
            const symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
                'vscode.executeDocumentSymbolProvider',
                file
            );

            const flattenedSymbols = symbols ? CmlHoverProvider.flattenSymbols(symbols) : [];

            for (const parsedAuthor of parsedAuthors) {
                const relatedSymbol = flattenedSymbols
                    .filter(symbol => symbol.selectionRange.start.line >= parsedAuthor.range.start.line)
                    .sort((a, b) =>
                        a.selectionRange.start.line - b.selectionRange.start.line
                    )[0];

                authors.push({
                    author: {
                        name: parsedAuthor.name,
                        contact: parsedAuthor.contact,
                        repository: parsedAuthor.repository,
                    },
                    range: parsedAuthor.range,
                    uri: file,
                    filePath: vscode.workspace.asRelativePath(file, false),
                    lineNumber: parsedAuthor.lineNumber,
                    symbolType: relatedSymbol?.kind ? vscode.SymbolKind[relatedSymbol.kind] : undefined,
                });
            }
        } catch {
            continue;
        }
    }

    if (authors.length === 0) {
        vscode.window.showInformationMessage('No documented authors found in the workspace.');
        return;
    }

    const input = vscode.window.createInputBox();
    input.title = 'Search CML authors';
    input.placeholder = "Enter an author's name";
    input.prompt = 'Search for authors across the workspace';
    input.show();

    input.onDidAccept(async () => {
        const query = input.value.trim().toLowerCase();
        input.dispose();

        if (!query)
            return;

        const filteredAuthors = authors.filter((entry) =>
            entry.author?.name.toLowerCase().includes(query)
        );

        if (filteredAuthors.length === 0) {
            vscode.window.showInformationMessage('No authors matched your search.');
            return;
        }

        const quickPick = vscode.window.createQuickPick<CmlAuthorQuickPickItem>();
        quickPick.placeholder = 'Select an author entry';
        quickPick.items = filteredAuthors.map(buildAuthorsWorkQuickPick);

        quickPick.onDidAccept(async () => {
            const selected = quickPick.selectedItems[0];
            if (selected)
                await revealAuthorsWork(selected.authorData);
            quickPick.dispose();
        });

        quickPick.onDidHide(() => quickPick.dispose());
        quickPick.show();
    });

    input.onDidHide(() => input.dispose());
}