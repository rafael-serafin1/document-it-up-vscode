import * as vscode from 'vscode';

interface SummaryEntry {
    description: string;
    range: vscode.Range;
}

//<summary>Classe responsável por prover o modal de hover.</summary>
export class CmlHoverProvider implements vscode.HoverProvider {
    async provideHover(document: vscode.TextDocument, position: vscode.Position): Promise<vscode.Hover | undefined> {
        const entry = await this.findSummaryEntry(document, position);

        if (!entry) {
            return undefined;
        }

        const markdown = new vscode.MarkdownString();
        markdown.appendMarkdown(`### Summary\n\n${entry.description}`);

        return new vscode.Hover(markdown, entry.range);
    }

    private async findSummaryEntry(document: vscode.TextDocument, position: vscode.Position): Promise<SummaryEntry | undefined> {
        const summaries = await this.parseSummaries(document);

        for (const entry of summaries)
            if (entry.range.contains(position))
                return entry;

        return undefined;
    }

    private async parseSummaries(document: vscode.TextDocument): Promise<SummaryEntry[]> {
        const entries: SummaryEntry[] = [];

        for (let lineIndex = 0; lineIndex < document.lineCount; lineIndex++) {

            const line = document.lineAt(lineIndex).text;
            const summaryMatch = line.match(/<summary>(.*?)<\/summary>/i);

            if (!summaryMatch) {
                continue;
            }

            const description = summaryMatch[1].trim();

            if (!description) {
                continue;
            }

            const symbol = await this.findFollowingSymbol(
                document,
                lineIndex + 1
            );

            if (!symbol) {
                continue;
            }

            entries.push({
                description,
                range: symbol.range
            });
        }

        return entries;
    }

    private async findFollowingSymbol(document: vscode.TextDocument, startLine: number): Promise<{ range: vscode.Range } | undefined> {
        const symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
            "vscode.executeDocumentSymbolProvider",
            document.uri
        );

        if (!symbols) {
            return undefined;
        }

        const flatSymbols = this.flattenSymbols(symbols);

        let closest: vscode.DocumentSymbol | undefined;

        for (const symbol of flatSymbols) {

            if (symbol.selectionRange.start.line < startLine) {
                continue;
            }

            if (
                !closest ||
                symbol.selectionRange.start.line < closest.selectionRange.start.line
            ) {
                closest = symbol;
            }
        }

        if (!closest) {
            return undefined;
        }

        return {
            range: closest.selectionRange
        };
    }

    private flattenSymbols(symbols: vscode.DocumentSymbol[]): vscode.DocumentSymbol[] {
        const result: vscode.DocumentSymbol[] = [];

        const visit = (symbol: vscode.DocumentSymbol) => {

            result.push(symbol);

            for (const child of symbol.children) {
                visit(child);
            }
        };

        for (const symbol of symbols) {
            visit(symbol);
        }

        return result;
    }

}