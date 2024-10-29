import * as vscode from 'vscode';
import { NotebookCell, RawNotebook } from '../types';

const defaultNotebook: RawNotebook = {
    version: "1",
    context: [],
    cells: []
};

export class AINotebookSerializer implements vscode.NotebookSerializer {

    constructor() {
        this.isBuffer = this.isBuffer.bind(this);
        this.mapRawCellToNotebookCellData = this.mapRawCellToNotebookCellData.bind(this);
        this.parseOutputs = this.parseOutputs.bind(this);
    }

    private validateCells(cells: NotebookCell[]): boolean {
        if (!Array.isArray(cells)) { return false; }

        return !cells.find(item => !item.type || typeof item.content === "undefined");
    }

    private readContents(content: Uint8Array): RawNotebook {
        const textContent = new TextDecoder().decode(content);

        try {
            const notebook = <RawNotebook>JSON.parse(textContent);

            if (!this.validateCells(notebook.cells)) { throw new Error("Invalid cells"); }

            return notebook;
        } catch (e) {
            console.error(e);
        }

        return defaultNotebook;
    }

    private mapNotebookDataToRawNotebook(notebook: vscode.NotebookData): RawNotebook {
        return {
            ...defaultNotebook,
            version: notebook.metadata?.version ?? defaultNotebook.version,
            model: notebook.metadata?.model,
            context: notebook.metadata?.context ?? defaultNotebook.context,
            cells: notebook.cells.map(this.mapNotebookCellToRawCell)
        };
    }

    private mapNotebookCellToRawCell(cell: vscode.NotebookCellData): NotebookCell {
        return {
            type: cell.languageId,
            isCode: cell.kind === vscode.NotebookCellKind.Code,
            content: cell.value,
            outputs: cell.outputs?.map(output => JSON.stringify(output))
        };
    }

    private isBuffer(element: any): boolean {
        return element !== null
            && typeof element === 'object'
            && 'type' in element
            && element.type === 'Buffer'
            && 'data' in element
            && Array.isArray(element.data);
    }

    private parseOutputs(k: string, v: any): any {
        if (this.isBuffer(v)) { return Buffer.from(v.data); }

        return v;
    }

    private mapRawCellToNotebookCellData(cell: NotebookCell): vscode.NotebookCellData | null {
        try {
            // Set it as "code" type so it can be "run" by vscode
            const cellData = new vscode.NotebookCellData(cell.isCode ? vscode.NotebookCellKind.Code : vscode.NotebookCellKind.Markup, cell.content, cell.type);

            if (cell.outputs) {
                cellData.outputs = cell.outputs.map(output => JSON.parse(output, this.parseOutputs));
            }

            return cellData;
        } catch (e) {
            console.error(e);
            return null;
        }
    }

    deserializeNotebook(content: Uint8Array, token: vscode.CancellationToken): vscode.NotebookData | Thenable<vscode.NotebookData> {
        const { version, model, cells: rawCells, context } = this.readContents(content);

        const cells = rawCells.map(this.mapRawCellToNotebookCellData).filter(cell => !!cell);

        const metadata = {
            version,
            model,
            context
        };

        const notebook = new vscode.NotebookData(cells);

        notebook.metadata = metadata;

        return notebook;
    }

    serializeNotebook(data: vscode.NotebookData, token: vscode.CancellationToken): Uint8Array | Thenable<Uint8Array> {
        const rawNotebook = this.mapNotebookDataToRawNotebook(data);

        return new TextEncoder().encode(JSON.stringify(rawNotebook));
    }

}