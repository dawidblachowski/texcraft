/*
  Warnings:

  - A unique constraint covering the columns `[projectId,filePath,filename]` on the table `File` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "File_projectId_filePath_filename_key" ON "File"("projectId", "filePath", "filename");
