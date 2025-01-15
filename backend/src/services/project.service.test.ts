import prisma from '../config/database';
import ProjectService from './project.service';
import PdfService from './pdf.service';
import FilesService from './files.service';

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
        },
    },
}));
jest.mock('../config/logger');

describe('ProjectService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createProject', () => {
        it('should throw an error if title is missing', async () => {
            await expect(ProjectService.createProject({ title: '' }, 'userId')).rejects.toThrow('Tytuł jest wymagany');
        });

        it('should create a project', async () => {
            (prisma.project.create as jest.Mock).mockResolvedValue({
                id: 'projectId',
                title: 'title',
                userId: 'userId',
                user: { id: 'userId', email: 'user@example.com' },
                description: null,
                archived: false,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            const project = await ProjectService.createProject({ title: 'title' }, 'userId');
            expect(project).toEqual({
                id: 'projectId',
                title: 'title',
                userId: 'userId',
                user: { id: 'userId', email: 'user@example.com' },
                description: null,
                archived: false,
                createdAt: expect.any(Date),
                updatedAt: expect.any(Date)
            });
        });
    });

    describe('getOwnProjects', () => {
        it('should fetch own projects', async () => {
            (prisma.project.findMany as jest.Mock).mockResolvedValue([{
                id: 'projectId',
                title: 'title',
                userId: 'userId',
                user: { id: 'userId', email: 'user@example.com' },
                description: null,
                archived: false,
                createdAt: new Date(),
                updatedAt: new Date()
            }]);
            const projects = await ProjectService.getOwnProjects('userId');
            expect(projects).toEqual([{
                id: 'projectId',
                title: 'title',
                userId: 'userId',
                user: { id: 'userId', email: 'user@example.com' },
                description: null,
                archived: false,
                createdAt: expect.any(Date),
                updatedAt: expect.any(Date)
            }]);
        });
    });

    describe('getSharedProjects', () => {
        it('should fetch shared projects', async () => {
            (prisma.project.findMany as jest.Mock).mockResolvedValue([{
                id: 'projectId',
                title: 'title',
                userId: 'userId',
                user: { id: 'userId', email: 'user@example.com' },
                description: null,
                archived: false,
                createdAt: new Date(),
                updatedAt: new Date()
            }]);
            const projects = await ProjectService.getSharedProjects('userId');
            expect(projects).toEqual([{
                id: 'projectId',
                title: 'title',
                userId: 'userId',
                user: { id: 'userId', email: 'user@example.com' },
                description: null,
                archived: false,
                createdAt: expect.any(Date),
                updatedAt: expect.any(Date)
            }]);
        });
    });

    describe('getArchivedProjects', () => {
        it('should fetch archived projects', async () => {
            (prisma.project.findMany as jest.Mock).mockResolvedValue([{
                id: 'projectId',
                title: 'title',
                userId: 'userId',
                user: { id: 'userId', email: 'user@example.com' },
                description: null,
                archived: true,
                createdAt: new Date(),
                updatedAt: new Date()
            }]);
            const projects = await ProjectService.getArchivedProjects('userId');
            expect(projects).toEqual([{
                id: 'projectId',
                title: 'title',
                userId: 'userId',
                user: { id: 'userId', email: 'user@example.com' },
                description: null,
                archived: true,
                createdAt: expect.any(Date),
                updatedAt: expect.any(Date)
            }]);
        });
    });

    describe('getAllProjects', () => {
        it('should fetch all projects', async () => {
            jest.spyOn(ProjectService, 'getOwnProjects').mockResolvedValue([{
                id: 'ownProjectId',
                title: 'ownTitle',
                userId: 'userId',
                user: { id: 'userId', email: 'user@example.com' },
                description: null,
                archived: false,
                createdAt: new Date(),
                updatedAt: new Date()
            }]);
            jest.spyOn(ProjectService, 'getSharedProjects').mockResolvedValue([{
                id: 'sharedProjectId',
                title: 'sharedTitle',
                userId: 'userId',
                user: { id: 'userId', email: 'user@example.com' },
                description: null,
                archived: false,
                createdAt: new Date(),
                updatedAt: new Date()
            }]);
            const projects = await ProjectService.getAllProjects('userId');
            expect(projects).toEqual([
                {
                    id: 'ownProjectId',
                    title: 'ownTitle',
                    userId: 'userId',
                    user: { id: 'userId', email: 'user@example.com' },
                    description: null,
                    archived: false,
                    createdAt: expect.any(Date),
                    updatedAt: expect.any(Date)
                },
                {
                    id: 'sharedProjectId',
                    title: 'sharedTitle',
                    userId: 'userId',
                    user: { id: 'userId', email: 'user@example.com' },
                    description: null,
                    archived: false,
                    createdAt: expect.any(Date),
                    updatedAt: expect.any(Date)
                }
            ]);
        });
    });

    describe('getProjectIfUserHasRights', () => {
        it('should fetch project if user has rights', async () => {
            (prisma.project.findFirst as jest.Mock).mockResolvedValue({
                id: 'projectId',
                title: 'title',
                userId: 'userId',
                user: { id: 'userId', email: 'user@example.com' },
                description: null,
                archived: false,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            const project = await ProjectService.getProjectIfUserHasRights('projectId', 'userId');
            expect(project).toEqual({
                id: 'projectId',
                title: 'title',
                userId: 'userId',
                user: { id: 'userId', email: 'user@example.com' },
                description: null,
                archived: false,
                createdAt: expect.any(Date),
                updatedAt: expect.any(Date)
            });
        });
    });

    describe('updateProject', () => {
        it('should update a project', async () => {
            jest.spyOn(ProjectService, 'getProjectIfUserHasRights').mockResolvedValue({
                id: 'projectId',
                title: 'title',
                userId: 'userId',
                user: { id: 'userId', email: 'user@example.com' },
                description: null,
                archived: false,
                createdAt: new Date(),
                updatedAt: new Date(), 
                sharedWith: []
            });
            (prisma.project.update as jest.Mock).mockResolvedValue({
                id: 'projectId',
                title: 'newTitle',
                userId: 'userId',
                user: { id: 'userId', email: 'user@example.com' },
                description: 'desc',
                archived: false,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            const project = await ProjectService.updateProject('projectId', { title: 'newTitle', description: 'desc', archived: false }, 'userId');
            expect(project).toEqual({
                id: 'projectId',
                title: 'newTitle',
                userId: 'userId',
                user: { id: 'userId', email: 'user@example.com' },
                description: 'desc',
                archived: false,
                createdAt: expect.any(Date),
                updatedAt: expect.any(Date)
            });
        });
    });

    describe('deleteProject', () => {
        it('should delete a project', async () => {
            jest.spyOn(ProjectService, 'getProjectIfUserHasRights').mockResolvedValue({
                id: 'projectId',
                title: 'title',
                userId: 'userId',
                user: { id: 'userId', email: 'user@example.com' },
                description: null,
                archived: false,
                createdAt: new Date(),
                updatedAt: new Date(), 
                sharedWith: []
            });
            await ProjectService.deleteProject('projectId', 'userId');
            expect(prisma.project.delete).toHaveBeenCalledWith({ where: { id: 'projectId' } });
        });
    });

    describe('shareProject', () => {
        it('should share a project', async () => {
            jest.spyOn(ProjectService, 'getProjectIfUserHasRights').mockResolvedValue({
                id: 'projectId',
                title: 'title',
                userId: 'userId',
                user: { id: 'userId', email: 'user@example.com' },
                description: null,
                archived: false,
                createdAt: new Date(),
                updatedAt: new Date(),
                sharedWith: []
            });
            (prisma.user.findFirst as jest.Mock).mockResolvedValue({ id: 'sharedUserId', email: 'shared@example.com' });
            await ProjectService.shareProject('projectId', 'shared@example.com', 'userId');
            expect(prisma.project.update).toHaveBeenCalledWith({
                where: { id: 'projectId' },
                data: { sharedWith: { connect: { id: 'sharedUserId' } } }
            });
        });
    });

    describe('unshareProject', () => {
        it('should unshare a project', async () => {
            jest.spyOn(ProjectService, 'getProjectIfUserHasRights').mockResolvedValue({
                id: 'projectId',
                title: 'title',
                userId: 'userId',
                user: { id: 'userId', email: 'user@example.com' },
                description: null,
                archived: false,
                createdAt: new Date(),
                updatedAt: new Date(),
                sharedWith: [{ id: 'sharedUserId', email: 'shared@example.com' }]
            });
            (prisma.user.findFirst as jest.Mock).mockResolvedValue({ id: 'sharedUserId', email: 'shared@example.com' });
            await ProjectService.unshareProject('projectId', 'shared@example.com', 'userId');
            expect(prisma.project.update).toHaveBeenCalledWith({
                where: { id: 'projectId' },
                data: { sharedWith: { disconnect: { id: 'sharedUserId' } } }
            });
        });
    });

    describe('createTexFile', () => {
        it('should create a TeX file', async () => {
            jest.spyOn(ProjectService, 'getProjectIfUserHasRights').mockResolvedValue({
                id: 'projectId',
                title: 'title',
                userId: 'userId',
                user: { id: 'userId', email: 'user@example.com' },
                description: null,
                archived: false,
                createdAt: new Date(),
                updatedAt: new Date(), 
                sharedWith: []
            });
            jest.spyOn(FilesService, 'createEmptyTexFile').mockResolvedValue(undefined);
            (prisma.file.create as jest.Mock).mockResolvedValue({
                id: 'fileId',
                filename: 'fileName',
                projectId: 'projectId'
            });
            const file = await ProjectService.createTexFile('projectId', 'fileName', null, 'userId');
            expect(file).toEqual({
                id: 'fileId',
                filename: 'fileName',
                projectId: 'projectId'
            });
        });
    });

    describe('uploadFile', () => {
        it('should upload a file', async () => {
            jest.spyOn(ProjectService, 'getProjectIfUserHasRights').mockResolvedValue({
                id: 'projectId',
                title: 'title',
                userId: 'userId',
                user: { id: 'userId', email: 'user@example.com' },
                description: null,
                archived: false,
                createdAt: new Date(),
                updatedAt: new Date(), 
                sharedWith: []
            });
            (prisma.file.create as jest.Mock).mockResolvedValue({
                id: 'fileId',
                filename: 'fileName',
                projectId: 'projectId'
            });
            const file = await ProjectService.uploadFile('projectId', null, 'fileName', 'userId');
            expect(file).toEqual({
                id: 'fileId',
                filename: 'fileName',
                projectId: 'projectId'
            });
        });
    });

    describe('getFilesStructure', () => {
        it('should get files structure', async () => {
            jest.spyOn(ProjectService, 'getProjectIfUserHasRights').mockResolvedValue({
                id: 'projectId',
                title: 'title',
                userId: 'userId',
                user: { id: 'userId', email: 'user@example.com' },
                description: null,
                archived: false,
                createdAt: new Date(),
                updatedAt: new Date(), 
                sharedWith: []
            });
            (prisma.file.findMany as jest.Mock).mockResolvedValue([{
                id: 'fileId',
                filename: 'fileName',
                projectId: 'projectId'
            }]);
            const files = await ProjectService.getFilesStructure('projectId', 'userId');
            expect(files).toEqual([{
                id: 'fileId',
                filename: 'fileName',
                projectId: 'projectId'
            }]);
        });
    });

    describe('createDirectory', () => {
        it('should create a directory', async () => {
            jest.spyOn(ProjectService, 'getProjectIfUserHasRights').mockResolvedValue({
                id: 'projectId',
                title: 'title',
                userId: 'userId',
                user: { id: 'userId', email: 'user@example.com' },
                description: null,
                archived: false,
                createdAt: new Date(),
                updatedAt: new Date(), 
                sharedWith: []
            });
            jest.spyOn(FilesService, 'createDirectory').mockResolvedValue('dirPath');
            (prisma.file.create as jest.Mock).mockResolvedValue({
                id: 'dirId',
                filename: 'dirName',
                projectId: 'projectId',
                isDirectory: true
            });
            await ProjectService.createDirectory('projectId', 'dirName', null, 'userId');
            expect(prisma.file.create).toHaveBeenCalledWith({
                data: {
                    filename: 'dirName',
                    parentId: null,
                    mimeType: null,
                    projectId: 'projectId',
                    isDirectory: true,
                },
            });
        });
    });

    describe('getPdf', () => {
        it('should get PDF', async () => {
            jest.spyOn(ProjectService, 'getProjectIfUserHasRights').mockResolvedValue({
                id: 'projectId',
                title: 'title',
                userId: 'userId',
                user: { id: 'userId', email: 'user@example.com' },
                description: null,
                archived: false,
                createdAt: new Date(),
                updatedAt: new Date(), 
                sharedWith: []
            });
            jest.spyOn(PdfService, 'ensureTempDir').mockResolvedValue(undefined);
            jest.spyOn(PdfService, 'createCustomFolder').mockResolvedValue('customFolderPath');
            jest.spyOn(PdfService, 'copyRecursiveSync').mockResolvedValue(undefined);
            jest.spyOn(PdfService, 'compileLatexToPdf').mockResolvedValue({ path: 'pdfPath', logs: 'logs' });
            const result = await ProjectService.getPdf('projectId', 'userId');
            expect(result).toEqual({ pdfPath: 'pdfPath', logs: 'logs', customFolderPath: 'customFolderPath' });
        });
    });
});
