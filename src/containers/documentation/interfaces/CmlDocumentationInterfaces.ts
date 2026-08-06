import * as vscode from "vscode"
import { AuthorEntry, EntryEntry, ExitEntry } from "../../../providers/interfaces/CmlInterfaces";

//<synopsis>Quick Pick Authors</synopsis>
export interface CmlAuthorQuickPickItem extends vscode.QuickPickItem {
    authorData: AuthorSearchResult;
}

//<synopsis>Quick Pick Entry</synopsis>
export interface CmlQuickPickEntryItem extends vscode.QuickPickItem {
    entryData: EntrySearchResult;
}

//<synopsis>Quick Pick Exit</synopsis>
export interface CmlQuickPickExitItem extends vscode.QuickPickItem {
    exitData: ExitSearchResult;
}

//<synopsis>Quick Pick Author's Data Interface</synopsis>
export interface AuthorSearchResult extends AuthorEntry {
    uri: vscode.Uri;
    filePath: string;
    lineNumber: number;
    symbolType?: string;
}

//<synopsis>Quick Pick Entry Data Interface</synopsis>
export interface EntrySearchResult extends EntryEntry {
    uri: vscode.Uri;
    filePath: string;
    lineNumber: number;
}

//<synopsis>Quick Pick Exit Data Interface</synopsis>
export interface ExitSearchResult extends ExitEntry {
    uri: vscode.Uri;
    filePath: string;
    lineNumber: number;
}