import { DATA_FOLDER } from "../config/env";
import fs from 'fs';
import path from 'path';
import sanitize from 'sanitize-filename';

export default class FilesService {
    static async createEmptyTexFile(filePath: string, projectId: string, fileName: string) {
        if (DATA_FOLDER === undefined) {
            throw new Error('Folder danych nie jest zdefiniowany');
        }

        fileName = sanitize(fileName);
        filePath = sanitize(filePath);

        if (filePath.includes('..')) {
            throw new Error("Nieprawidłowa ścieżka pliku");
        }

        const projectDir = path.join(DATA_FOLDER, projectId);

        if (!fs.existsSync(projectDir)) {
            fs.mkdirSync(projectDir, { recursive: true });
        }

        const endpath = path.join(projectDir, filePath, fileName);
        if (fs.existsSync(endpath)) {
            throw new Error(`Plik już istnieje`);
        }

        try {
            const dir = path.dirname(endpath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(endpath, '');
        } catch {
            throw new Error(`Nie udało się utworzyć pliku`);
        }
    }

    static async removeFile(filePath: string, projectId: string) {
        if (DATA_FOLDER === undefined) {
            throw new Error('Folder danych nie jest zdefiniowany');
        }

        filePath = sanitize(filePath);

        if (filePath.includes('..')) {
            throw new Error("Nieprawidłowa ścieżka pliku");
        }

        const projectDir = path.join(DATA_FOLDER, projectId);
        const endpath = path.join(projectDir, filePath);
        try {
            fs.unlinkSync(endpath);
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to remove file at ${endpath}: ${error.message}`);
            } else {
                throw new Error(`Failed to remove file at ${endpath}: Unknown error`);
            }
        }
    }

    static async createDirectory(projectId: string, subPath: string) {
        if (DATA_FOLDER === undefined) {
            throw new Error('Folder danych nie jest zdefiniowany');
        }

        const dir = path.join(DATA_FOLDER, projectId, sanitize(subPath));

        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        return dir;
    }
}
