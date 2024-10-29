import * as vscode from 'vscode';

export async function showModelSelector(models: vscode.LanguageModelChat[], _notebook: vscode.NotebookDocument) {
    const entries = models.map(model => `${model.id} - ${model.vendor}`);

    const value = await vscode.window.showQuickPick(entries);

    if (!value) { return; }

    const selectedModel = models[entries.indexOf(value)];

    const edit = new vscode.WorkspaceEdit();

    const notebookEdit = vscode.NotebookEdit.updateNotebookMetadata({
        ..._notebook.metadata,
        model: {
            vendor: selectedModel.vendor,
            id: selectedModel.id
        }
    });

    edit.set(_notebook.uri, [notebookEdit]);

    vscode.workspace.applyEdit(edit);

    vscode.window.showInformationMessage(`Model "${selectedModel.id}" selected`);
}

export async function selectModel() {
    if (!vscode.window.activeNotebookEditor) {
        vscode.window.showErrorMessage("No AI Notebook active");
        return;
    }

    const models = await vscode.lm.selectChatModels();

    if (!models.length) {
        vscode.window.showInformationMessage("No models available");
        return;
    }

    showModelSelector(models, vscode.window.activeNotebookEditor?.notebook);
}