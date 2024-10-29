export interface RawNotebook {
    version: string,
    model?: NotebookModel,
    context: ContextItem[],
    cells: NotebookCell[],
}

export interface ContextItem {
    type: string,
    content: string,
}

export interface NotebookCell {
    type: string,
    content: string,
    outputs?: string[],
    isCode: boolean
}

export interface NotebookModel {
    vendor: string,
    id: string,
}