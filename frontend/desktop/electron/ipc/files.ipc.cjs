const { ipcMain } = require('electron');
const archiver = require('archiver');
const fs = require('fs');
const path = require('path');

ipcMain.handle('files:compress', async (_, { files, outputPath, format }) => {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputPath);
    const archive = archiver(format || 'zip', { zlib: { level: 6 } });

    output.on('close', () => resolve(outputPath));
    archive.on('error', (err) => reject(err));

    archive.pipe(output);
    files.forEach(f => {
      archive.append(Buffer.from(f.content, 'base64'), { name: f.name });
    });
    archive.finalize();
  });
});
