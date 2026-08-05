import * as vscode from 'vscode';
import { SummaryEntry, CmlAuthor, CmlParam, CmlSee, AuthorEntry, SinceEntry, CmlStatus } from './interfaces/CmlInterfaces';
import { Contains, Style, styleText } from '../utils/Utils';

//<summary>Classe responsável por prover o modal de hover.</summary>
//<note>Miséria e ódio para o JAVASCRIPT.</note>
//<since>0.5.7</since>
export class CmlHoverProvider implements vscode.HoverProvider {
    async provideHover(document: vscode.TextDocument, position: vscode.Position): Promise<vscode.Hover | undefined> {
        const entry = await this.findSummaryEntry(document, position);
        const authorEntry = await this.findAuthorEntry(document, position);
        const sinceEntry = await this.findSinceEntry(document, position);

        if (!entry && !authorEntry)
            return undefined;

        const markdown = new vscode.MarkdownString();

        //catch all <since> tags
        if (sinceEntry) {
            if (sinceEntry?.since){
                if (sinceEntry?.status && sinceEntry?.status.type)
                    markdown.appendMarkdown(`\n\n***${sinceEntry.status.type.toUpperCase()}*** ${((sinceEntry.status.desc) ? sinceEntry.status.desc : "No description.")}`);
                markdown.appendMarkdown(`\n\n*since ${sinceEntry.since}*\n\n---\n\n`);
            }
        }
        
        //catch all <author> tags
        if (authorEntry?.author) {
            markdown.appendMarkdown(`## Author: **${authorEntry.author.name}**`);
            if (authorEntry.author.contact)
                markdown.appendMarkdown(`\n\n-\tcontact: ${authorEntry.author.contact}`);
            if (authorEntry.author.repository)
                markdown.appendMarkdown(`\n\n-\trepository: [${authorEntry.author.name.toUpperCase()}'s Repository](${authorEntry.author.repository})`);
        }

        // catch all common entries
        if (entry) {
            if (authorEntry?.author)
                markdown.appendMarkdown(`\n\n---\n\n`);

            markdown.appendMarkdown(`### Summary\n\n${entry.description}`);

            if (entry.params.length > 0) {
                markdown.appendMarkdown(`\n\n---\n\n### Params\n`);
                for (const param of entry.params)
                    markdown.appendMarkdown(`\n- \`${param.name}\`: ${param.description}`);
            }

            if (entry.returnDescription)
                markdown.appendMarkdown(`\n\n---\n\n### Return\n\n${entry.returnDescription}`);

            if (entry.see.length > 0) {
                markdown.appendMarkdown(`\n\n---\n\n### You should see these\n`);
                for (const item of entry.see) {
                    if (item.linkage === 'path') {
                        const uri = vscode.Uri.file(item.attr);
                        markdown.appendMarkdown(`\n- [${item.attr}](${uri.toString()})`);
                    }
                    else if (item.linkage === 'url') 
                        markdown.appendMarkdown(`\n- [${item.attr}](${item.linkage})`);
                    else 
                        markdown.appendMarkdown(`\n- #${item.attr}`);
                }
            }

            if (entry.seealso && entry.seealso.length > 0) {
                markdown.appendMarkdown(`\n\n---\n\n### See also\n`);
                for (const item of entry.see) {
                    if (item.linkage === 'path') {
                        const uri = vscode.Uri.file(item.attr);
                        markdown.appendMarkdown(`\n- [${item.attr}](${uri.toString()})`);
                    }
                    else if (item.linkage === 'url') 
                        markdown.appendMarkdown(`\n- <a href=\"${item.attr}\">${item.attr}</a>`);
                    else 
                        markdown.appendMarkdown(`\n- ${item.attr}`);
                }
            }

            if (entry.note)
                markdown.appendMarkdown(`\n\n---\n\n#### Note:\n\n- ${entry.note}`);

            if (entry?.warning)
                markdown.appendMarkdown(`\n\n---\n\n> ⚠ **Warning**\n\n>${entry.warning}`);
        }

        return new vscode.Hover(markdown, entry?.range ?? authorEntry?.range);
    }

//<label>TAGS</label>
//<desc>Acha as entradas de summary, param, entre outros, e faz parsing dele.</desc>
//<span>

//<label>FINDERS</label>
//<desc>Procuradores</desc>
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

    //<summary>Reune todas as metadatas da tag 'author'</summary>
    //<param name="document">Recebe o documento de texto provido pelo VSCode.</param>
    //<param name="position">Recebe a posição do cursor dentro do arquivo.</param>
    //<return>Uma Promise podendo conter tanto uma interface 'AuthorEntry'.</return>
    //<warn>Pode retornar 'undefined' também!</warn>
    private async findAuthorEntry(document: vscode.TextDocument, position: vscode.Position): Promise<AuthorEntry | undefined> {
        const authors = await this.parseAuthorBetween(document);

        for (const author of authors) 
            if (author.range.contains(position))
                return author;

        return undefined;
    }

    private async findSinceEntry(document: vscode.TextDocument, position: vscode.Position): Promise<SinceEntry | undefined> {
        const sinces = await this.parseSinceBetween(document);

        for (const since of sinces)
            if (since.range.contains(position))
                return since;

        return undefined;
    }
//</span>

//<label>PARSERS_PRINCIPAIS</label>
//<desc>Parseadores principais de tags únicas.</desc>
//<span>

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

            const symbolRange = await this.findFollowingSymbol(document, lineIndex + 1);

            if (!symbolRange)
                continue;

            const params = this.parseParamsBetweenLines(document, lineIndex + 1, symbolRange.start.line);
            const returnDescription = this.parseReturnBetweenLines(document, lineIndex + 1, symbolRange.start.line);
            const note = this.parseNote(document, lineIndex + 1, symbolRange.start.line);
            const warning = this.parseWarn(document, lineIndex + 1, symbolRange.start.line);
            const see = this.parseSeeBetweenLines(document, lineIndex + 1, symbolRange.start.line);
            const seealso = this.parseSeeAlsoBetweenLines(document, lineIndex + 1, symbolRange.start.line);

            entries.push({
                description,
                params,
                see,
                seealso,
                returnDescription,
                note,
                warning,
                range: symbolRange
            });
        }

        return entries;
    }

    private async parseAuthorBetween(document: vscode.TextDocument): Promise<AuthorEntry[]> {
        const authors: AuthorEntry[] = [];
        const authorRegex = /<author\s*([^>]*)>(.*?)<\/author>/i;
        const attributeRegex = /(contact|repository)\s*=\s*"([^"]+)"/gi;
        
        for (let lineIndex = 0; lineIndex < document.lineCount; ++lineIndex) {
            const line = document.lineAt(lineIndex).text;
            const authorMatch = line.match(authorRegex);

            if (!authorMatch)
                continue;

            const name = authorMatch[2].trim();

            if (!name)
                continue;

            const symbolRange = await this.findFollowingSymbol(document, lineIndex + 1);

            if (!symbolRange)
                continue;

            const attrs = CmlHoverProvider.parseAttributes(authorMatch[1]);

            authors.push({
                author: {
                    name,
                    contact: attrs.contact,
                    repository: attrs.repository
                },
                range: symbolRange
            });
        } 

        return authors;   
    }

    //<summary>Cataloga todos as tags 'since'.</summary>
    //<param name="document">Documento de texto do VS Code</param>
    //<return>Uma Promise contendo um vetor de interfaces.</return>
    private async parseSinceBetween(document: vscode.TextDocument): Promise<SinceEntry[]> {
        const sinces: SinceEntry[] = [];
        const sinceRegex = /<since>(.*?)<\/since>/i;

        for (let lineIndex = 0; lineIndex < document.lineCount; ++lineIndex) {
            const line = document.lineAt(lineIndex).text;
            const sinceMatch = line.match(sinceRegex);

            if (!sinceMatch)
                continue;

            const since = sinceMatch[1].trim();

            if (!since)
                continue;

            const symbolRange = await this.findFollowingSymbol(document, lineIndex + 1);

            if (!symbolRange)
                continue;

            const status = this.parseStatusBetweenLines(document, lineIndex + 1, symbolRange.start.line);

            sinces.push({
                since,
                status,
                range: symbolRange
            })
        }

        return sinces;
    }

//</span>

    //<summary>Parseia as tags 'param', visto em mente que pode ter mais de uma.</summary>
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

    //<summary>Parseia as tags 'return'.</summary>
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

    //<summary>Parseia as tags 'note'</summary>
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

    //<summary>Parseia as tags 'warn'</summary>
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

    //<summary>Parseia as tags 'see', podendo haver mais de uma simultaneamente.</summary>
    //<see target="./CmlHoverProvider.ts170:5" />
    private parseSeeBetweenLines(document: vscode.TextDocument, startLine: number, endLine: number): CmlSee[] {
        const see: CmlSee[] = [];
        const seeRegex =/<see\s+(path|url|target)\s*=\s*"([^"]+)"\s*\/>/gi;

        for (let lineIndex = startLine; lineIndex < endLine && lineIndex < document.lineCount; lineIndex++) {
            const line = document.lineAt(lineIndex).text;

            for (const match of line.matchAll(seeRegex)) {
                const linkage = match[1] as "path" | "url" | "target";
                const attr = match[2].trim();

                if (!attr)
                    continue;

                see.push({
                    attr,
                    linkage
                });
            }
        }

        return see;
    }

    //<summary>Parseia as tags 'see', podendo haver mais de uma simultaneamente.</summary>
    //<see path="./src/providers/CmlHoverProvider.ts" />
    private parseSeeAlsoBetweenLines(document: vscode.TextDocument, startLine: number, endLine: number): CmlSee[] {
        const see: CmlSee[] = [];
        const seeRegex = /<seealso\s+(path|url|target)\s*=\s*"([^"]+)"\s*\/>/gi;

        for (let lineIndex = startLine; lineIndex < endLine && lineIndex < document.lineCount; lineIndex++) {
            const line = document.lineAt(lineIndex).text;

            for (const match of line.matchAll(seeRegex)) {
                const linkage = match[1] as "path" | "url" | "target";
                const attr = match[2].trim();

                if (!attr)
                    continue;

                see.push({
                    attr,
                    linkage
                });
            }
        }

        return see;
    }

    //<summary>Parseia a tag 'status'</summary>
    //<since>0.6.2</since>
    //<status type="deprecated">Marked for removal in 0.6.9</status>
    private parseStatusBetweenLines(document: vscode.TextDocument, startLine: number, endLine: number): CmlStatus | undefined {
        const statusRegex = /<status\s+(type)\s*=\s*"([^"]+)"\s*>(.*?)<\/status>/gi;
        const allValues = ["deprecated", "bugged", "todo"];             

        for (let lineIndex = startLine; lineIndex < endLine && lineIndex < document.lineCount; lineIndex++) {
            const line = document.lineAt(lineIndex).text;

            for (const match of line.matchAll(statusRegex)) {
                const attrValue = match[2].trim();
                const desc = match[3].trim();

                if (!attrValue)
                    continue;

                if (!Contains(allValues, attrValue)) {
                    vscode.window.showErrorMessage(`No such type for <status> called: '${attrValue}'`);
                    return undefined;
                }

                return {
                    type: attrValue,
                    desc
                };
            }
        }

        return undefined;
    }
//</span>

//<label>ATTRIBUTES_PARSER</label>
//<desc>Implementação do parser para tags multi-atributos</desc>
//<span>

    public static parseAttributes(text: string): Record<string, string> {
        const regex = /(\w+)\s*=\s*"([^"]+)"/g;
        const attrs: Record<string, string> = {};

        for (const match of text.matchAll(regex))
            attrs[match[1]] = match[2];

        return attrs;
    }

// </span>

//<label>SYMBOLS</label>
//<desc>Tenho é medo disso</desc>
//<span>
    private async findFollowingSymbol(document: vscode.TextDocument, startLine: number): Promise<vscode.Range | undefined> {
        const symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
            "vscode.executeDocumentSymbolProvider",
            document.uri
        );

        const flatSymbols = symbols ? CmlHoverProvider.flattenSymbols(symbols) : [];

        const candidates = flatSymbols.filter(symbol => symbol.selectionRange.start.line >= startLine);
        if (candidates.length > 0) {
            candidates.sort((left, right) => left.selectionRange.start.line - right.selectionRange.start.line);
            return candidates[0].selectionRange;
        }

        return this.findFallbackSymbolRange(document, startLine);
    }

    private findFallbackSymbolRange(document: vscode.TextDocument, startLine: number): vscode.Range | undefined {
        let insideBlockComment: boolean = false;

        for (let lineIndex = startLine; lineIndex < document.lineCount; lineIndex++) {
            const line = document.lineAt(lineIndex).text;
            const trimmed = line.trim();

            // linha vazia
            if (!trimmed)
                continue;

            // comentários de bloco
            if (insideBlockComment) {
                if (trimmed.includes("*/"))
                    insideBlockComment = false;

                continue;
            }

            if (trimmed.startsWith("/*")) {
                if (!trimmed.includes("*/"))
                    insideBlockComment = true;

                continue;
            }

            // comentários de linha
            if (
                trimmed.startsWith("//")    ||
                trimmed.startsWith("#")     ||
                trimmed.startsWith(";")     ||
                trimmed.startsWith("*")
            ) {
                continue;
            }

            // linhas contendo apenas delimitadores
            if (/^[{}\[\]();,]+$/.test(trimmed))
                continue;

            // primeiro código encontrado
            return new vscode.Range(
                new vscode.Position(lineIndex, 0),
                new vscode.Position(lineIndex, line.length)
            );
        }

        return undefined;
    }

    public static flattenSymbols(symbols: vscode.DocumentSymbol[]): vscode.DocumentSymbol[] {
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