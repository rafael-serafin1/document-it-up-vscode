import * as vscode from "vscode";
import { CmlNavigationProvider } from "./providers/CmlContainerProvider";

export function CmlViewContainer(context: vscode.ExtensionContext) {
    const tree_provider = new CmlNavigationProvider();
    
    context.subscriptions.push(vscode.window.registerTreeDataProvider("cml.docitup", tree_provider));
}