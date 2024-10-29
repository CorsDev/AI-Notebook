import * as vscode from 'vscode';
import { NotebookModel } from '../types';
import { showModelSelector } from '../utils/selectModel';


export class AINotebookController {
    readonly controllerId = 'ai-notebook-controller';
    readonly notebookType = 'ainotebook';
    readonly label = 'AI Notebook';
    readonly supportedLanguages = ['markdown'];
    private readonly _controller: vscode.NotebookController;
    private _executionOrder = 0;

    constructor() {
        this._controller = vscode.notebooks.createNotebookController(
            this.controllerId,
            this.notebookType,
            this.label
        );

        this._controller.supportedLanguages = this.supportedLanguages;
        this._controller.supportsExecutionOrder = true;
        this._controller.executeHandler = this._execute.bind(this);
    }

    public get controller(): vscode.NotebookController {
        return this._controller;
    }

    private _execute(
        cells: vscode.NotebookCell[],
        _notebook: vscode.NotebookDocument,
        _controller: vscode.NotebookController
    ): void {
        cells.forEach(cell => this._executeForCell(cell, _notebook, _controller));
    }

    private async _executeForCell(cell: vscode.NotebookCell,
        _notebook: vscode.NotebookDocument,
        _controller: vscode.NotebookController): Promise<void> {

        const modelConfig = _notebook.metadata.model as NotebookModel | undefined;

        // No documented way to add custom language models, we need to add ollama support manually
        const models = await vscode.lm.selectChatModels(modelConfig);

        if (!modelConfig) {
            showModelSelector(models, _notebook);

            vscode.window.showInformationMessage("No model selected");
            return;
        }

        if (!models.length) { return; }

        const model = models[0];

        const execution = this._controller.createNotebookCellExecution(cell);
        execution.executionOrder = ++this._executionOrder;
        execution.start(Date.now());

        try {

            const chatResponse = await model.sendRequest([
                vscode.LanguageModelChatMessage.User(cell.document.getText())
            ], {}, new vscode.CancellationTokenSource().token);

            let output = "";

            for await (const fragment of chatResponse.text) {
                output += fragment;
                execution.replaceOutput(new vscode.NotebookCellOutput([vscode.NotebookCellOutputItem.text(output, 'text/markdown')]));
            }

        } catch (e) {
            execution.replaceOutput(new vscode.NotebookCellOutput([vscode.NotebookCellOutputItem.error(<Error>e)]));
        }

        execution.end(true, Date.now());
    }


}