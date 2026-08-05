import * as vscode from "vscode";
import { NavigationItem } from "./CmlButtonProvider";

export class CmlNavigationProvider
    implements vscode.TreeDataProvider<NavigationItem> {

    private readonly rootItems: NavigationItem[] = [

        new NavigationItem(
            "Navigation",
            [
                new NavigationItem(
                    "Show Labels",
                    [],
                    "cml.showLabels",
                    "group-by-ref-type"
                ),

                new NavigationItem(
                    "Show Hierarchy",
                    [],
                    "cml.showHierarchy",
                    "list-tree"
                ),

                new NavigationItem(
                    "Jump to Entry",
                    [],
                    "cml.jumpToEntry",
                    "sign-in"
                )
            ]
        ),

        new NavigationItem(
            "Documentation",
            [
                new NavigationItem(
                    "Search by Author's Name",
                    [],
                    "cml.searchByAuthor",
                    "search-fuzzy"
                )
            ]
        ),
    ];

    getTreeItem(element: NavigationItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: NavigationItem): NavigationItem[] {
        if (!element)
            return this.rootItems;

        return element.children;
    }
}