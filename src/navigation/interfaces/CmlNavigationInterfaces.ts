import * as vscode from 'vscode';
import { CmlLabel } from '../../CmlParser';
import { AuthorEntry } from '../../providers/interfaces/CmlInterfaces';

//<summary>Quick Pick Labels</summary>
export interface CmlQuickPickItem extends vscode.QuickPickItem {
  labelData: CmlLabel;
}

//<summary>Quick Pick Authors</summary>
export interface CmlAuthorQuickPickItem extends vscode.QuickPickItem {
    authorData: AuthorSearchResult;
}

//<summary>Quick Pick Author's Data Interface</summary>
export interface AuthorSearchResult extends AuthorEntry {
    uri: vscode.Uri;
    filePath: string;
    lineNumber: number;
    symbolType?: string;
}