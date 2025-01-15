import FilesService from './files.service';
import fs from 'fs';
import path from 'path';
import prisma from '../config/database';
import logger from '../config/logger';
import { DATA_FOLDER } from '../config/env';
import { File } from '@prisma/client';

jest.mock('fs');
jest.mock('path');
jest.mock('../config/logger');

jest.mock('../config/database', () => ({
    __esModule: true,
    default: {
        project: {
            create: jest.fn(),
            findMany: jest.fn(),
            findFirst: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        user: {
            findFirst: jest.fn(),
        },
        file: {
            create: jest.fn(),
            findMany: jest.fn(),
            findFirst: jest.fn(),
            findUnique: jest.fn(),
        },
    },
}));

jest.mock('../config/env', () => ({
    __esModule: true,
    DATA_FOLDER: './data',
  }));

describe('FilesService', () => {
    const mockProjectId = 'projectId';
    const mockFileId = 'fileId';
    const mockFileName = 'fileName.tex';
    const mockParentId = '';
    const mockContent = 'file content';
    const mockDataFolder = './data'; // Set a default value for mockDataFolder

    beforeEach(() => {
        process.env.DATA_FOLDER = mockDataFolder; // Ensure DATA_FOLDER is set before each test
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('createEmptyTexFile', () => {
        it('should create an empty TeX file', async () => {
            jest.spyOn(fs, 'existsSync').mockReturnValue(false);
            fs.writeFileSync = jest.fn();

            await FilesService.createEmptyTexFile(null, mockProjectId, mockFileName);

            expect(fs.writeFileSync).toHaveBeenCalledWith(path.join(mockDataFolder, mockProjectId, mockFileName), '');
            expect(logger.info).toHaveBeenCalledWith(`Created empty TeX file at ${path.join(mockDataFolder, mockProjectId, mockFileName)}`);
        });

        it('should throw an error if file already exists', async () => {
            jest.spyOn(fs, 'existsSync').mockReturnValue(true);

            await expect(FilesService.createEmptyTexFile(null, mockProjectId, mockFileName)).rejects.toThrow('Plik już istnieje');
        });
    });

    describe('removeFile', () => {
        it('should remove a file', async () => {
            jest.spyOn(fs, 'existsSync').mockReturnValue(true);
            fs.unlinkSync = jest.fn();

            await FilesService.removeFile(mockFileName, mockProjectId);

            expect(fs.unlinkSync).toHaveBeenCalledWith(path.join(mockDataFolder, mockProjectId, mockFileName));
            expect(logger.info).toHaveBeenCalledWith(`Removed file at ${path.join(mockDataFolder, mockProjectId, mockFileName)}`);
        });

        it('should throw an error if file does not exist', async () => {
            jest.spyOn(fs, 'existsSync').mockReturnValue(false);

            await expect(FilesService.removeFile(mockFileName, mockProjectId)).rejects.toThrow('Plik nie istnieje');
        });
    });

    describe('createDirectory', () => {
        it('should create a directory', async () => {
            fs.mkdirSync = jest.fn();

            await FilesService.createDirectory(mockProjectId, mockFileName);

            expect(fs.mkdirSync).toHaveBeenCalledWith(path.join(mockDataFolder, mockProjectId, mockFileName), { recursive: true });
            expect(logger.info).toHaveBeenCalledWith(`Created directory at ${path.join(mockDataFolder, mockProjectId, mockFileName)}`);
        });
    });

    describe('getFilesStructureForProject', () => {
        it('should return files structure for a project', async () => {
            const mockFiles = [{ 
                id: mockFileId, 
                filename: mockFileName, 
                projectId: mockProjectId, 
                parentId: null, 
                mimeType: null, 
                createdAt: new Date(), 
                isDirectory: false 
            }];
            jest.spyOn(prisma.file, 'findMany').mockResolvedValue(mockFiles);

            const files = await FilesService.getFilesStructureForProject(mockProjectId);

            expect(files).toEqual(mockFiles);
        });
    });

    describe('getFileById', () => {
        it('should return a file by id', async () => {
            const mockFile: File = { 
                id: mockFileId, 
                filename: mockFileName, 
                projectId: mockProjectId, 
                parentId: null, 
                mimeType: null, 
                createdAt: new Date(), 
                isDirectory: false 
            };
            jest.spyOn(prisma.file, 'findUnique').mockResolvedValue(mockFile);

            const file = await FilesService.getFileById(mockFileId);

            expect(file).toEqual(mockFile);
        });
    });

    describe('getFileContent', () => {
        it('should return file content', async () => {
            process.env.DATA_FOLDER = mockDataFolder;
            const mockFile: File = { 
                id: mockFileId, 
                filename: mockFileName, 
                projectId: mockProjectId, 
                parentId: null, 
                mimeType: null, 
                createdAt: new Date(), 
                isDirectory: false 
            };
            jest.spyOn(prisma.file, 'findUnique').mockResolvedValue(mockFile);
            jest.spyOn(fs, 'existsSync').mockReturnValue(true);
            jest.spyOn(fs, 'readFileSync').mockReturnValue(mockContent);

            const content = await FilesService.getFileContent(mockFileId);

            expect(content).toEqual(mockContent);
        });
    });

    describe('saveFileContent', () => {
        it('should save file content', async () => {
            process.env.DATA_FOLDER = mockDataFolder; // Ensure DATA_FOLDER is defined
            const mockFile: File = { 
                id: mockFileId, 
                filename: mockFileName, 
                projectId: mockProjectId, 
                parentId: null, 
                mimeType: null, 
                createdAt: new Date(), 
                isDirectory: false 
            };
            jest.spyOn(prisma.file, 'findUnique').mockResolvedValue(mockFile);
            jest.spyOn(fs, 'existsSync').mockReturnValue(true);
            fs.writeFileSync = jest.fn();

            await FilesService.saveFileContent(mockFileId, mockContent);

            expect(fs.writeFileSync).toHaveBeenCalledWith(path.join(mockDataFolder, mockProjectId, mockFileName), mockContent);
            expect(logger.info).toHaveBeenCalledWith(`Saved content of file at ${path.join(mockDataFolder, mockProjectId, mockFileName)}`);
        });
    });
});
