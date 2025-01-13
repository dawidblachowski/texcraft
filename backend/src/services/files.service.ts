import { DATA_FOLDER } from "../config/env";
import fs from 'fs';
import path from 'path';
import sanitize from 'sanitize-filename';
import prisma from '../config/database';
import logger from "../config/logger";
import { File } from "@prisma/client";

export default class FilesService {
    static async createEmptyTexFile(parentId: string | null, projectId: string, fileName: string) {
        if (DATA_FOLDER === undefined) {
            throw new Error('Folder danych nie jest zdefiniowany');
        }

        fileName = sanitize(fileName);

        if (fileName.includes('..')) {
            throw new Error("Nieprawidłowa nazwa pliku");
        }

        const projectDir = path.join(DATA_FOLDER, projectId);

        if (!fs.existsSync(projectDir)) {
            fs.mkdirSync(projectDir, { recursive: true });
        }

        let dirPath = projectDir;
        if (parentId) {
            const parentDir = await prisma.file.findUnique({
                where: { id: parentId },
                select: { filename: true, parentId: true },
            });

            if (!parentDir) {
                throw new Error("Nie znaleziono katalogu nadrzędnego");
            }

            dirPath = path.join(projectDir, parentDir.filename);
        }

        const endpath = path.join(dirPath, fileName);
        if (fs.existsSync(endpath)) {
            throw new Error(`Plik już istnieje`);
        }

        try {
            fs.writeFileSync(endpath, '');
            logger.info(`Created empty TeX file at ${endpath}`);
        } catch {
            logger.error(`Failed to create file at ${endpath}`);
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
            logger.info(`Removed file at ${endpath}`);
        } catch (error) {
            if (error instanceof Error) {
                logger.error(`Failed to remove file at ${endpath}: ${error.message}`);
                throw new Error(`Failed to remove file at ${endpath}: ${error.message}`);
            } else {
                logger.error(`Failed to remove file at ${endpath}: Unknown error`);
                throw new Error(`Failed to remove file at ${endpath}: Unknown error`);
            }
        }
    }

    static async createDirectory(projectId: string, subPath: string) {
        if (DATA_FOLDER === undefined) {
            throw new Error('Folder danych nie jest zdefiniowany');
        }

        const dir = path.join(DATA_FOLDER, projectId, sanitize(subPath));

        fs.mkdirSync(dir, { recursive: true });
        logger.info(`Created directory at ${dir}`);

        return dir;
    }

    static async getFilesStructureForProject(projectId: string) {
        try {
            const files = await prisma.file.findMany({
                where: { projectId },
            });
            return files;
        } catch (error) {
            logger.error(`Failed to get files structure for project ${projectId}: ${error}`);
            throw new Error(`Failed to get files structure for project ${projectId}`);
        }
    }

    static async getFileById(fileId: string) {
        try {
            const file = await prisma.file.findUnique({
                where: { id: fileId },
            });
            return file;
        } catch (error) {
            logger.error(`Failed to get file by id ${fileId}: ${error}`);
            throw new Error(`Failed to get file by id ${fileId}`);
        }
    }

    static async getFileContent(fileId:string): Promise<string> {
        if (DATA_FOLDER === undefined) {
            throw new Error('Folder danych nie jest zdefiniowany');
        }
        let file
        try {
            file = await prisma.file.findUnique({
                where: { id: fileId },
            });
            if(!file){
                throw new Error('Plik nie istnieje w bazie');
            }
        } catch (error) {
            logger.error(`Failed to get file by id ${fileId}: ${error}`);
            throw new Error(`Failed to get file by id ${fileId}`);
        }
        const filePath = await this.getFilePathFromFile(file);

        if (!filePath) {
            throw new Error('Ścieżka pliku jest nieprawidłowa');
        }
        const filePathFull = path.join(DATA_FOLDER, file.projectId, filePath);
        if (!fs.existsSync(filePathFull)) {
            throw new Error('Plik nie istnieje');
        }

        try {
            const content = fs.readFileSync(filePathFull, 'utf8');
            logger.info(`Got content of file at ${filePathFull}`);
            return content;
        } catch (error) {
            logger.error(`Failed to get content of file at ${filePathFull}: ${error}`);
            throw new Error(`Failed to get content of file at ${filePathFull}`);
        }
    }

    static async getFilePathFromFile(file: File): Promise<string> {
        if (file.parentId === null) {
            return file.filename;
        }

        const parentDir = await prisma.file.findUnique({
            where: { id: file.parentId },
        });

        if (!parentDir) {
            throw new Error("Nie znaleziono katalogu nadrzędnego");
        }

        return path.join(await this.getFilePathFromFile(parentDir), file.filename);
    }

    static async saveFileContent(fileId: string, content: string) {
        if (DATA_FOLDER === undefined) {
            throw new Error('Folder danych nie jest zdefiniowany');
        }

        let file
        try {
            file = await prisma.file.findUnique({
                where: { id: fileId },
            });
            if(!file){
                throw new Error('Plik nie istnieje w bazie');
            }
        } catch (error) {
            logger.error(`Failed to get file by id ${fileId}: ${error}`);
            throw new Error(`Failed to get file by id ${fileId}`);
        }
        const filePath = await this.getFilePathFromFile(file);

        if (!filePath) {
            throw new Error('Ścieżka pliku jest nieprawidłowa');
        }
        const filePathFull = path.join(DATA_FOLDER, file.projectId, filePath);
        if (!fs.existsSync(filePathFull)) {
            throw new Error('Plik nie istnieje');
        }

        try {
            fs.writeFileSync(filePathFull, content);
            logger.info(`Saved content of file at ${filePathFull}`);
        } catch (error) {
            logger.error(`Failed to save content of file at ${filePathFull}: ${error}`);
            throw new Error(`Failed to save content of file at ${filePathFull}`);
        }
    }

}
