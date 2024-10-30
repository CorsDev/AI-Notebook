// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { AINotebookSerializer } from './notebook/serializer';
import { AINotebookController } from './notebook/controller';
import { selectModel, showModelSelector } from './utils/selectModel';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	const serializer = vscode.workspace.registerNotebookSerializer("ainotebook", new AINotebookSerializer());
	const aiNotebookController = new AINotebookController();
	vscode.commands.registerCommand("ainotebook.selectmodel", selectModel);

	context.subscriptions.push(serializer);
	context.subscriptions.push(aiNotebookController.controller);
}

// This method is called when your extension is deactivated
export function deactivate() {}
