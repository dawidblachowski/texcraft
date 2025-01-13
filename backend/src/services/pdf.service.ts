import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import { TEMP_DIR } from '../config/env';
import logger from '../config/logger';

export default class PdfService {
  static async ensureTempDir(): Promise<void> {
    if(!TEMP_DIR) {
        logger.error('TEMP_DIR is not defined');
        throw new Error('TEMP_DIR is not defined');
    }
    const absoluteTempDir = path.resolve(TEMP_DIR);
    logger.info(`TEMP_DIR resolved to ${absoluteTempDir}`);
    try {
        if(!fs.existsSync(absoluteTempDir)) {
            fs.mkdirSync(absoluteTempDir);
            logger.info(`Created TEMP_DIR at ${absoluteTempDir}`);
        } else {
            logger.info(`TEMP_DIR already exists at ${absoluteTempDir}`);
        }
    } catch (error) {
        const err = error as Error;
        logger.error(`Failed to create TEMP_DIR at ${absoluteTempDir}: ${err.message}`);
        throw new Error(`Failed to create TEMP_DIR at ${absoluteTempDir}: ${err.message}`);
    }
  }

  static async createRandomFolder(): Promise<string> {
    const randomFolderName = uuidv4();
    if (!TEMP_DIR) {
      throw new Error('TEMP_DIR is not defined');
    }
    const absoluteTempDir = path.resolve(TEMP_DIR);
    const tempSubDir = path.join(absoluteTempDir, randomFolderName);
    fs.mkdirSync(tempSubDir);
    logger.info(`Created random folder at ${tempSubDir}`);
    return tempSubDir;
  }

  static async createCustomFolder(): Promise<string> {
    const customFolderName = uuidv4();
    if (!TEMP_DIR) {
        throw new Error('TEMP_DIR is not defined');
    }
    const absoluteTempDir = path.resolve(TEMP_DIR);
    const customFolderPath = path.join(absoluteTempDir, customFolderName);
    const projectFolderPath = path.join(customFolderPath, 'project');
    const outputFolderPath = path.join(customFolderPath, 'output');

    fs.mkdirSync(customFolderPath);
    fs.mkdirSync(projectFolderPath);
    fs.mkdirSync(outputFolderPath);

    logger.info(`Created custom folder at ${customFolderPath} with subfolders /project and /output`);
    return customFolderPath;
  }

  static async copyRecursiveSync(src: string, dest: string): Promise<void> {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest);
      logger.info(`Created destination directory at ${dest}`);
    }

    fs.readdirSync(src).forEach((file) => {
      const srcFile = path.join(src, file);
      const destFile = path.join(dest, file);

      if (fs.lstatSync(srcFile).isDirectory()) {
        this.copyRecursiveSync(srcFile, destFile);
      } else {
        fs.copyFileSync(srcFile, destFile);
      }
    });
    logger.info(`Copied files from ${src} to ${dest}`);
  }

  static async compileLatexToPdf(mainTexPath: string, outputDir: string): Promise<{ path: string; logs: string }> {
    return new Promise((resolve, reject) => {
      const command = `pdflatex -interaction=nonstopmode -output-directory=${outputDir} ${mainTexPath}`;
      exec(command, (error, stdout, stderr) => {
        if (error) {
          logger.error(`LaTeX compilation error: ${stderr.trim()}`);
          return reject({ message: `Błąd kompilacji LaTeX: ${stderr.trim()}`, logs: stdout.trim() });
        }
        const compiledPdfPath = path.join(outputDir, 'main.pdf');
        if (!fs.existsSync(compiledPdfPath)) {
          logger.error('PDF file was not generated.');
          return reject({ message: 'Plik PDF nie został wygenerowany.', logs: stdout.trim() });
        }
        logger.info(`Successfully compiled LaTeX to PDF at ${compiledPdfPath}`);
        resolve({ path: compiledPdfPath, logs: stdout.trim() });
      });
    });
  }
}