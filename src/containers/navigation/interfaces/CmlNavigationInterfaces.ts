import * as vscode from 'vscode';
import { CmlLabel } from '../../../CmlParser';
import { AuthorEntry, EntryEntry, ExitEntry, LabelEntry } from '../../../providers/interfaces/CmlInterfaces';

//<synopsis>Quick Pick Labels</synopsis>
export interface CmlQuickPickLabelItem extends vscode.QuickPickItem {
  labelData: CmlLabel;
}

export interface LabelSearchResult extends LabelEntry {
    uri: vscode.Uri;
    filePath: string;
    lineNumber: number;
}