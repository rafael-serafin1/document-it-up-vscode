import * as vscode from "vscode";
import { CmlNavigationProvider } from "./providers/CmlContainerProvider";

export function CmlViewContainer() {
    const tree_provider = new CmlNavigationProvider();
    
    vscode.window.registerTreeDataProvider("cml.docitup", tree_provider);
}