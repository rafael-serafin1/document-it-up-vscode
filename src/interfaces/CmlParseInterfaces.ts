import * as vscode from "vscode";

export interface CmlAuthorParsed {
  name: string;
  contact?: string;
  repository?: string;
  range: vscode.Range;
  lineNumber: number;
}

export interface CmlEntryTagParsed {
  desc?: string;
  lang: string;
  range: vscode.Range;
  lineNumber: number;
}

export interface CmlExitTagParsed {
  desc?: string;
  lang: string;
  range: vscode.Range;
  lineNumber: number;
}