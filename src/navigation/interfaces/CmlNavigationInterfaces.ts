import * as vscode from 'vscode';
import { CmlLabel } from '../../CmlParser';
import { AuthorEntry, EntryEntry } from '../../providers/interfaces/CmlInterfaces';

//<summary>Quick Pick Labels</summary>
export interface CmlQuickPickLabelItem extends vscode.QuickPickItem {
  labelData: CmlLabel;
}

//<summary>Quick Pick Authors</summary>
export interface CmlAuthorQuickPickItem extends vscode.QuickPickItem {
    authorData: AuthorSearchResult;
}

export interface CmlQuickPickEntryItem extends vscode.QuickPickItem {
    entryData: EntrySearchResult;
}

//<summary>Quick Pick Author's Data Interface</summary>
export interface AuthorSearchResult extends AuthorEntry {
    uri: vscode.Uri;
    filePath: string;
    lineNumber: number;
    symbolType?: string;
}

export interface EntrySearchResult extends EntryEntry {
    uri: vscode.Uri;
    filePath: string;
    lineNumber: number;
}