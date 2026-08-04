import * as vscode from 'vscode';

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

export interface SummaryEntry {
    description: string;
    params: CmlParam[];
    see: CmlSee[];
    seealso?: CmlSee[];
    returnDescription?: string;
    note?: string;
    warning?: string;
    range: vscode.Range;
}

export interface AuthorEntry {
    author?: CmlAuthor;
    range: vscode.Range;
}

export interface SinceEntry {
    since?: string;
    status?: CmlStatus;
    range: vscode.Range;
}