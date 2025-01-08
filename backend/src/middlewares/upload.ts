// src/middleware/upload.ts
import fs from 'fs';
import path from 'path';
import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';
import { DATA_FOLDER } from '../config/env';
import { MAX_FILE_SIZE } from '../config/env';
import FilesService from '@/services/files.service';

const storage = multer.diskStorage({
  destination: (req: Request, file, cb) => {
    const { projectId } = req.params;
    const subPath = (req.body.subPath || '').toString();

    if (!projectId) {
      return cb(new Error('Brak ID projektu'), '');
    }

    if(DATA_FOLDER === undefined) {
        return cb(new Error('Brak folderu danych'), '');
    }
    const dir = path.join(DATA_FOLDER, projectId, subPath);

    fs.mkdirSync(dir, { recursive: true });

    cb(null, dir);
  },
  filename: (req: Request, file, cb) => {
    cb(null, file.originalname);
  },
});

function fileFilter(req: Request, file: Express.Multer.File, cb: FileFilterCallback) {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'application/pdf', 'text/plain', 'text/x-tex'];
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(new Error('Niedozwolony typ pliku. Dozwolone tylko JPEG, PNG, PDF, TXT i TEX.'));
  }
  cb(null, true);
}

export const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: MAX_FILE_SIZE ? parseInt(MAX_FILE_SIZE) : 5 * 1024 * 1024 }, // 5MB limit
});
