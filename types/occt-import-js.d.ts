declare module 'occt-import-js' {
    export interface OCCImportOptions {
        type: 'step' | 'iges';
        linearDeflection?: number;
        angularDeflection?: number;
    }

    export interface STLExportOptions {
        binary?: boolean;
    }

    export interface LoadResult {
        success: boolean;
        error?: string;
    }

    export class OCCImport {
        constructor();
        init(): Promise<void>;
        load(data: Uint8Array, options: OCCImportOptions): Promise<LoadResult>;
        convertToStl(options?: STLExportOptions): Promise<ArrayBuffer>;
    }
} 