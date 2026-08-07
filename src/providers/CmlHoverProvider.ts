import * as vscode from 'vscode';
import { SynopsisEntry, CmlAuthor, CmlParam, CmlSee, AuthorEntry, SinceEntry, CmlStatus, CmlPlatform, StatusEntry, CmlExample } from './interfaces/CmlInterfaces';
import { Contains, Style, styleText, TrimCommentSection } from '../utils/Utils';
import { environment, statusValues, support } from './completion/CmlAttributeValuesCompletionProvider';

//<label>HOVER_PROVIDER</label>
//<desc>Provedor de conteúdo para o Hover</desc>
//<span>

//<synopsis>Classe responsável por prover o modal de hover.</synopsis>
//<note>Deixo aqui minha nota de repúdio: miséria e ódio para o JAVASCRIPT.</note>
//<status type="experimental">Ta dando boxta ae</status>
//<since>0.5.7</since>
//<author>Skrom</author>
export class CmlHoverProvider implements vscode.HoverProvider {
    async provideHover(document: vscode.TextDocument, position: vscode.Position): Promise<vscode.Hover | undefined> {
        const entry = await this.findSynopsisEntry(document, position);
        const authorEntry = await this.findAuthorEntry(document, position);

        const statusEntry = await this.findStatusEntry(document, position);
        const sinceEntry = await this.findSinceEntry(document, position);

        if (!entry && !authorEntry)
            return undefined;

        const markdown = new vscode.MarkdownString();

        //catch all <status> tags
        if (statusEntry)
            if (statusEntry.status)
                markdown.appendMarkdown(`\n\n***${(statusEntry.status.type) ? statusEntry.status.type.toUpperCase() : `UNDEFINED`}*** ${((statusEntry.status.desc) ? statusEntry.status.desc : "No description.")}\n`);

        //catch all <since> tags
        if (sinceEntry) 
            if (sinceEntry?.since)
                markdown.appendMarkdown(`\n*since ${sinceEntry.since}*\n\n---\n\n`);

        if (statusEntry?.platform) {
            statusEntry.platform.forEach(plat => {
                const support = plat.support ?? "Not specified";
                const desc = plat.desc ?? "No description";
                markdown.appendMarkdown(`\n\n### Platform ${plat.platform} - ${support}\n${desc}`);
            });
            markdown.appendMarkdown(`\n\n---\n\n`);
        }
        
        //catch all <author> tags
        if (authorEntry?.author) {
            if (statusEntry && !sinceEntry)
                markdown.appendMarkdown(`\n\n---\n\n`);
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

            markdown.appendMarkdown(`### Synopsis\n\n${entry.description}`);

            if (entry.params.length > 0) {
                markdown.appendMarkdown(`\n\n---\n\n### Params\n`);
                for (const param of entry.params)
                    markdown.appendMarkdown(`\n- \`${param.name}\`: ${param.description}`);
            }

            if (entry.returnDescription)
                markdown.appendMarkdown(`\n\n---\n\n### Return\n\n${entry.returnDescription}`);

            if (entry.examples && entry.examples.length > 0) {
                markdown.appendMarkdown(`\n\n---\n\n### Examples\n`);
                for (const example of entry.examples) {
                    const language = example.lang ? example.lang : '';
                    markdown.appendMarkdown(`\n\n\`\`\`${language}\n${example.desc}\n\`\`\``);
                }
            }

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
//</span>

//<label>TAGS</label>
//<desc>Acha as entradas de synopsis, param, entre outros, e faz parsing dele.</desc>
//<span>

//<label>FINDERS</label>
//<desc>Procuradores</desc>
//<span>

    //<synopsis>Acha todos os summaries</synopsis>
    //<param name="document">Recebe o documento de texto provido pelo VSCode.</param>
    //<param name="position">Recebe a posição do cursor dentro do arquivo.</param>
    //<return>Uma Promise podendo conter tanto uma interface 'SynopsisEntry'.</return>
    //<warn>Pode retornar 'undefined' também!</warn>
    private async findSynopsisEntry(document: vscode.TextDocument, position: vscode.Position): Promise<SynopsisEntry | undefined> {
        const summaries = await this.parseSummaries(document);

        for (const entry of summaries)
            if (entry.range.contains(position))
                return entry;

        return undefined;
    }

    //<synopsis>Reune todas as metadatas da tag 'author'</synopsis>
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

    //<synopsis>Responsável por reunir todas as metadatas da tag 'status' e achar a correspondente atual</synopsis>
    //<param name="document">Recebe o documento de texto provido pelo VSCode.</param>
    //<param name="position">Recebe a posição do cursor dentro do arquivo.</param>
    //<return>Uma Promise podendo conter tanto uma interface 'StatusEntry'.</return>
    //<warn>Pode retornar 'undefined' também!</warn>
    private async findStatusEntry(document: vscode.TextDocument, position: vscode.Position): Promise<StatusEntry | undefined> {
        const statuses = await this.parseStatusBetweenLines(document);

        for (const status of statuses) 
            if (status.range.contains(position))
                return status;

        return undefined;
    }

    //<synopsis>Responsável por reunir todas as metadatas da tag 'since' e achar a correspondente atual</synopsis>
    //<param name="document">Recebe o documento de texto provido pelo VSCode.</param>
    //<param name="position">Recebe a posição do cursor dentro do arquivo.</param>
    //<return>Uma Promise podendo conter tanto uma interface 'SinceEntry'.</return>
    //<warn>Pode retornar 'undefined' também!</warn>
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

    //<synopsis>Faz o parsing dos summaries.</synopsis>
    private async parseSummaries(document: vscode.TextDocument): Promise<SynopsisEntry[]> {
        const entries: SynopsisEntry[] = [];

        for (let lineIndex = 0; lineIndex < document.lineCount; lineIndex++) {
            const line = document.lineAt(lineIndex).text;
            const synopsisMatch = line.match(/<synopsis>(.*?)<\/synopsis>/i);

            if (!synopsisMatch)
                continue;

            let description = synopsisMatch[1].trim();

            if (!description)
                description = "No synopsis.";

            const symbolRange = await this.findFollowingSymbol(document, lineIndex + 1);

            if (!symbolRange)
                continue;

            const params = this.parseParamsBetweenLines(document, lineIndex + 1, symbolRange.start.line);
            const returnDescription = this.parseReturnBetweenLines(document, lineIndex + 1, symbolRange.start.line);
            const note = this.parseNote(document, lineIndex + 1, symbolRange.start.line);
            const warning = this.parseWarn(document, lineIndex + 1, symbolRange.start.line);
            const examples = this.parseExampleBetweenLines(document, lineIndex + 1, symbolRange.start.line);
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
                examples,
                range: symbolRange
            });
        }

        return entries;
    }

    //<synopsis>Parseia e reune todas as tags 'author'</synopsis>
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

    //<synopsis>Cataloga todos as tags 'since'.</synopsis>
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

            sinces.push({
                since,
                range: symbolRange
            })
        }

        return sinces;
    }

//</span>

    //<synopsis>Parseia as tags 'param', visto em mente que pode ter mais de uma.</synopsis>
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

    //<synopsis>Parseia as tags 'return'.</synopsis>
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

    //<synopsis>Entrada de dados</synopsis>
    //<example lang="ts">
    //  const examples = this.parseExampleBetweenLines(document, lineIndex + 1, symbolRange.range.end);
    //  for (const example of examples) {
    //      ...
    //  }
    //</example>
    private parseExampleBetweenLines(document: vscode.TextDocument, startLine: number, endLine: number): CmlExample[] {
        const examples: CmlExample[] = [];

        if (startLine >= document.lineCount)
            return examples;

        const sourceRange = new vscode.Range(
            new vscode.Position(startLine, 0),
            new vscode.Position(Math.min(endLine, document.lineCount), 0)
        );

        const text = document.getText(sourceRange);
        const exampleRegex = /<example\b([^>]*)>([\s\S]*?)<\/example>/gi;

        for (const match of text.matchAll(exampleRegex)) {
            const rawAttributes = match[1] ?? '';
            const langMatch = rawAttributes.match(/\blang\s*=\s*"([^"]*)"/i);
            const desc = TrimCommentSection(match[2].replace(/\r?\n/g, '\n').trim());

            if (!desc)
                continue;

            examples.push({
                desc,
                lang: langMatch?.[1]?.trim()
            });
        }

        return examples;
    }

    //<synopsis>Parseia as tags 'note'</synopsis>
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

    //<synopsis>Parseia as tags 'warn'</synopsis>
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

    //<synopsis>Parseia as tags 'see', podendo haver mais de uma simultaneamente.</synopsis>
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

    //<synopsis>Parseia as tags 'see', podendo haver mais de uma simultaneamente.</synopsis>
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

//<label>STATUS_RELATED_TAGS</label>
//<desc>Tags detectadas pela tag 'since'.</desc>
//<span>

    //<synopsis>Parseia a tag 'status'</synopsis>
    //<since>0.6.2</since>
    //<status type="deprecated">Marked for removal in 0.6.9</status>
    //<platform environment="win32" support="true">Possui suporte nativo ao Windows</platform>
    private async parseStatusBetweenLines(document: vscode.TextDocument): Promise<StatusEntry[]> {
        const statuses: StatusEntry[] = [];
        const statusRegex = /<status\s+(type)\s*=\s*"([^"]+)"\s*>(.*?)<\/status>/gi;
        const allValues = statusValues;

        for (let lineIndex = 0; lineIndex < document.lineCount; ++lineIndex) {
            const line = document.lineAt(lineIndex).text;

            for (const match of line.matchAll(statusRegex)) {
                const attrValue = match[2].trim();
                const desc = match[3].trim();

                if (!attrValue)
                    continue;

                if (!Contains(allValues, attrValue)) {
                    vscode.window.showErrorMessage(`No such type for <status> called: '${attrValue}'`);
                    continue;
                }

                const symbolRange = await this.findFollowingSymbol(document, lineIndex + 1);
                    
                if (!symbolRange)
                    continue;

                const platform = await this.parsePlatformBetweenLines(document, lineIndex + 1, symbolRange.start.line);

                statuses.push({
                    status: {
                        type: attrValue,
                        desc
                    },
                    platform,
                    range: symbolRange
                });
            }
        }

        return statuses;
    }

    private parsePlatformBetweenLines(document: vscode.TextDocument, startLine: number, endLine: number): CmlPlatform[] | undefined {
        const platforms: CmlPlatform[] = [];
        const envValues = environment;
        const supportValues = support;

        const sourceRange = new vscode.Range(
            new vscode.Position(startLine, 0),
            new vscode.Position(Math.min(endLine, document.lineCount), 0)
        );

        const text = document.getText(sourceRange);
        const platformRegex = /<platform\b([^>]*)>([\s\S]*?)<\/platform>/gi;

        for (const match of text.matchAll(platformRegex)) {
            const attrs = CmlHoverProvider.parseAttributes(match[1] ?? '');
            const environmentValue = attrs.environment?.trim();
            const supportValue = attrs.support?.trim();
            const desc = TrimCommentSection(match[2].replace(/\r?\n/g, '\n').trim());

            if (!environmentValue || !supportValue)
                continue;

            if (!Contains(envValues, environmentValue))
                vscode.window.showWarningMessage(`Unrecognized environment for <platform>: '${environmentValue}'`);

            if (!Contains(supportValues, supportValue))
                vscode.window.showWarningMessage(`Unrecognized support value for <platform>: '${supportValue}'`);

            platforms.push({
                platform: environmentValue,
                support: supportValue,
                desc
            });
        }

        return platforms;
    }
//</span>

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