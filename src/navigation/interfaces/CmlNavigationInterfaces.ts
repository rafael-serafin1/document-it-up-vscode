import * as vscode from 'vscode';
import { CmlLabel } from '../../CmlParser';
import { AuthorEntry } from '../../providers/interfaces/CmlInterfaces';

export interface CmlQuickPickItem extends vscode.QuickPickItem {
  labelData: CmlLabel;
}

export interface CmlAuthorQuickPickItem extends vscode.QuickPickItem {
    authorData: AuthorSearchResult;
}

export interface AuthorSearchResult extends AuthorEntry {
    uri: vscode.Uri;
    filePath: string;
    lineNumber: number;
    symbolType?: string;
}