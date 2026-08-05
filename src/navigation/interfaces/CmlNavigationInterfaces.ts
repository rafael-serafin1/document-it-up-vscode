import * as vscode from 'vscode';
import { CmlLabel } from '../../CmlParser';
import { AuthorEntry, EntryEntry, ExitEntry } from '../../providers/interfaces/CmlInterfaces';

//<summary>Quick Pick Labels</summary>
export interface CmlQuickPickLabelItem extends vscode.QuickPickItem {
  labelData: CmlLabel;
}

//<summary>Quick Pick Authors</summary>
export interface CmlAuthorQuickPickItem extends vscode.QuickPickItem {
    authorData: AuthorSearchResult;
}

//<summary>Quick Pick Entry</summary>
export interface CmlQuickPickEntryItem extends vscode.QuickPickItem {
    entryData: EntrySearchResult;
}

//<summary>Quick Pick Exit</summary>
export interface CmlQuickPickExitItem extends vscode.QuickPickItem {
    exitData: ExitSearchResult;
}

//<summary>Quick Pick Author's Data Interface</summary>
export interface AuthorSearchResult extends AuthorEntry {
    uri: vscode.Uri;
    filePath: string;
    lineNumber: number;
    symbolType?: string;
}

//<summary>Quick Pick Entry Data Interface</summary>
export interface EntrySearchResult extends EntryEntry {
    uri: vscode.Uri;
    filePath: string;
    lineNumber: number;
}

//<summary>Quick Pick Exit Data Interface</summary>
export interface ExitSearchResult extends ExitEntry {
    uri: vscode.Uri;
    filePath: string;
    lineNumber: number;
}