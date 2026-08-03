import * as vscode from 'vscode';

interface CmlParam {
    name: string;
    description: string;
}

interface SummaryEntry {
    description: string;
    params: CmlParam[];
    returnDescription?: string;
    note?: string;
    warning?: string;
    range: vscode.Range;
}

//<summary>Classe responsável por prover o modal de hover.</summary>
//<note>Miséria e ódio para o JAVASCRIPT.</note>
export class CmlHoverProvider implements vscode.HoverProvider {
    async provideHover(document: vscode.TextDocument, position: vscode.Position): Promise<vscode.Hover | undefined> {
        const entry = await this.findSummaryEntry(document, position);

        if (!entry)
            return undefined;

        const markdown = new vscode.MarkdownString();
        markdown.appendMarkdown(`### Summary\n\n${entry.description}`);

        if (entry.params.length > 0) {
            markdown.appendMarkdown(`\n\n---\n\n### Params\n`);
            for (const param of entry.params)
                markdown.appendMarkdown(`\n- **${param.name}**: ${param.description}`);
        }

        if (entry.returnDescription)
            markdown.appendMarkdown(`\n\n---\n\n### Return\n\n${entry.returnDescription}`);

        if (entry.note)
            markdown.appendMarkdown(`\n\n---\n\n#### Note:\n\n- ${entry.note}`);

        if (entry.warning)
            markdown.appendMarkdown(`\n\n---\n\n> ⚠ **Warning**\n\n>${entry.warning}`)

        return new vscode.Hover(markdown, entry.range);
    }

//<label>TAGS</label>
//<desc>Acha as entradas de summary, param, entre outros, e faz parsing dele.</desc>
//<span>

    //<summary>Acha todos os summaries</summary>
    //<param name="document">Recebe o documento de texto provido pelo VSCode.</param>
    //<param name="position">Recebe a posição do cursor dentro do arquivo.</param>
    //<return>Uma Promise podendo conter tanto uma interface 'SummaryEntry'.</return>
    //<warn>Pode retornar 'undefined' também!</warn>
    private async findSummaryEntry(document: vscode.TextDocument, position: vscode.Position): Promise<SummaryEntry | undefined> {
        const summaries = await this.parseSummaries(document);

        for (const entry of summaries)
            if (entry.range.contains(position))
                return entry;

        return undefined;
    }

    //<summary>Faz o parsing dos summaries.</summary>
    private async parseSummaries(document: vscode.TextDocument): Promise<SummaryEntry[]> {
        const entries: SummaryEntry[] = [];

        for (let lineIndex = 0; lineIndex < document.lineCount; lineIndex++) {

            const line = document.lineAt(lineIndex).text;
            const summaryMatch = line.match(/<summary>(.*?)<\/summary>/i);

            if (!summaryMatch)
                continue;

            const description = summaryMatch[1].trim();

            if (!description)
                continue;

            const symbol = await this.findFollowingSymbol(document, lineIndex + 1);

            if (!symbol)
                continue;

            const params = this.parseParamsBetweenLines(document, lineIndex + 1, symbol.range.start.line);
            const returnDescription = this.parseReturnBetweenLines(document, lineIndex + 1, symbol.range.start.line);
            const note = this.parseNote(document, lineIndex + 1, symbol.range.start.line);
            const warning = this.parseWarn(document, lineIndex + 1, symbol.range.start.line)

            entries.push({
                description,
                params,
                returnDescription,
                note,
                warning,
                range: symbol.range
            });
        }

        return entries;
    }

    //<summary>Parseia as tags param, visto em mente que pode ter mais de uma.</summary>
    private parseParamsBetweenLines(document: vscode.TextDocument, startLine: number, endLine: number): CmlParam[] {
        const params: CmlParam[] = [];
        const paramRegex = /<param\s+name="([^"]+)">(.*?)<\/param>/gi;

        for (let lineIndex = startLine; lineIndex < endLine && lineIndex < document.lineCount; lineIndex++) {
            const line = document.lineAt(lineIndex).text;
            const matches = line.matchAll(paramRegex);

            for (const match of matches) {
                const name = match[1].trim();
                const description = match[2].trim();

                if (!name || !description)
                    continue;

                params.push({ name, description });
            }
        }

        return params;
    }

    //<summary>Parseia as tags return.</summary>
    private parseReturnBetweenLines(document: vscode.TextDocument, startLine: number, endLine: number): string | undefined {
        const returnRegex = /<return>(.*?)<\/return>/i;

        for (let lineIndex = startLine; lineIndex < endLine && lineIndex < document.lineCount; ++lineIndex) {
            const line = document.lineAt(lineIndex).text;
            const match = line.match(returnRegex);

            if (!match)
                continue;

            const description = match[1].trim();
            return description || undefined;
        }

        return undefined;
    }

    //<summary>Parseia as tags note</summary>
    private parseNote(document: vscode.TextDocument, startLine: number, endLine: number): string | undefined {
        const noteRegex = /<note>(.*?)<\/note>/i;

        for (let lineIndex = startLine; lineIndex < endLine && lineIndex < document.lineCount; ++lineIndex) {
            const line = document.lineAt(lineIndex).text;
            const match = line.match(noteRegex);

            if (!match) 
                continue;

            const description = match[1].trim();
            return description || undefined;
        }

        return undefined
    }

    private parseWarn(document: vscode.TextDocument, startLine: number, endLine: number): string | undefined {
        const warnRegex = /<warn>(.*?)<\/warn>/i;

        for (let lineIndex = startLine; lineIndex < endLine && lineIndex < document.lineCount; ++lineIndex) {
            const line = document.lineAt(lineIndex).text;
            const match = line.match(warnRegex);

            if (!match) 
                continue;

            const description = match[1].trim();
            return description || undefined;
        }

        return undefined;
    }
//</span>

    private async findFollowingSymbol(document: vscode.TextDocument, startLine: number): Promise<{ range: vscode.Range } | undefined> {
        const symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
            "vscode.executeDocumentSymbolProvider",
            document.uri
        );

        if (!symbols)
            return undefined;

        const flatSymbols = this.flattenSymbols(symbols);

        let closest: vscode.DocumentSymbol | undefined;

        for (const symbol of flatSymbols) {
            if (symbol.selectionRange.start.line < startLine)
                continue;


            if (!closest || symbol.selectionRange.start.line < closest.selectionRange.start.line)
                closest = symbol;
        }

        if (!closest)
            return undefined;

        return {
            range: closest.selectionRange
        };
    }

    private flattenSymbols(symbols: vscode.DocumentSymbol[]): vscode.DocumentSymbol[] {
        const result: vscode.DocumentSymbol[] = [];

        const visit = (symbol: vscode.DocumentSymbol) => {

            result.push(symbol);

            for (const child of symbol.children)
                visit(child);
        };

        for (const symbol of symbols)
            visit(symbol);

        return result;
    }
    //</span>
}