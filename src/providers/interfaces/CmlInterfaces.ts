import * as vscode from 'vscode';
import { CmlLabel } from '../../CmlParser';

//<label>COMMON_INTERFACES</label>
//<desc>Interfaces comuns que representam certas tags.</desc>
//<span>
export interface CmlParam {
    name: string;
    description: string;
}

export interface CmlSee {
    attr: string;
    linkage: "path" | "url" | "target";
}

export interface CmlAuthor {
    name: string;
    contact?: string;
    repository?: string;
}

export interface CmlStatus {
    type?: string;
    desc?: string;
}

export interface CmlPlatform {
    platform: string;
    desc?: string;
}

export interface CmlEntry {
    desc?: string;
    lang: string;
}

export interface CmlExit {
    desc?: string;
    lang: string;
}

//</span>

//<label>HOVER_MARKDOWN_INTERFACES</label>
//<desc>Interfaces usadas na construção do Markdown do Hover Provider.</desc>
//<span>
export interface SynopsisEntry {
    description: string;
    params: CmlParam[];
    see: CmlSee[];
    seealso?: CmlSee[];
    returnDescription?: string;
    note?: string;
    warning?: string;
    range: vscode.Range;
}

export interface LabelEntry {
    label: CmlLabel;
    range: vscode.Range;
}

export interface AuthorEntry {
    author?: CmlAuthor;
    range: vscode.Range;
}

export interface EntryEntry {
    entry?: CmlEntry;
    range: vscode.Range;
}

export interface ExitEntry {
    exit?: CmlExit;
    range: vscode.Range;
}

export interface SinceEntry {
    since?: string;
    range: vscode.Range;
}

export interface StatusEntry {
    status?: CmlStatus;
    range: vscode.Range;
}

//</span>