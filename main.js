const { app, BrowserWindow, ipcMain, dialog } = require('electron'); // Importa los módulos necesarios de Electron
const path = require('path'); // Importa el módulo path para manejar rutas
const http = require('http'); // Importa el módulo http para crear un servidor
const fs = require('fs-extra'); // Importa fs-extra para trabajar con el sistema de archivos
const { PDFDocument, rgb } = require('pdf-lib'); // Importa PDFDocument y rgb de pdf-lib para manipular PDFs

// Función para crear la ventana de la aplicación
function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // Ruta al script preload
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false
    }
  });

  win.loadFile('index.html'); // Carga el archivo HTML en la ventana
}

// Maneja el evento para seleccionar un directorio
ipcMain.handle('select-directory', async (event) => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });
  return result.filePaths[0]; // Devuelve la ruta del directorio seleccionado
});

app.whenReady().then(createWindow); // Crea la ventana cuando la aplicación esté lista

// Maneja el evento cuando todas las ventanas están cerradas
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit(); // Cierra la aplicación si no es macOS
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow(); // Vuelve a crear la ventana si no hay ventanas abiertas (solo en macOS)
  }
});

// Función principal para procesar PDFs
async function processPDFs(directoryPath, operation) {
  let processedFilesCount = 0;
  let generatedPdfsCount = 0;
  const details = [];

  async function processDirectory(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const pdfFiles = [];

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await processDirectory(fullPath); // Procesa la subcarpeta de manera recursiva
      } else if (entry.isFile() && path.extname(entry.name).toLowerCase() === '.pdf') {
        pdfFiles.push(fullPath); // Agrega el archivo PDF a la lista
      }
    }

    if (pdfFiles.length > 0) {
      await unifyPDFs(dir, pdfFiles, details); // Unifica los PDFs en la carpeta actual
    }
  }

  await processDirectory(directoryPath);

  // Aquí puedes agregar cualquier lógica adicional que necesites después de procesar todas las carpetas y archivos
}

// Función para unificar todos los archivos PDF en un directorio
async function unifyPDFs(dir, pdfFiles, details) {
  try {
    const log = message => {
      details.push(message); // Agrega el mensaje al array de detalles
      console.log(message); // También lo muestra en la consola para depuración
      // Enviar mensaje a la ventana renderizada
      BrowserWindow.getAllWindows()[0].webContents.send('log-message', message);
    };

    const pdfDocs = [];
    
    for (const file of pdfFiles) {
      log(`Añadiendo::: ${file} al documento unificado`);
      const pdfBuffer = await fs.readFile(file); // Lee el archivo PDF como un buffer
      const pdfDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true }); // Carga el PDF en pdf-lib ignorando la encriptación
      pdfDocs.push(pdfDoc);
    }

    if (pdfDocs.length > 0) {
      const mergedPdf = await PDFDocument.create(); // Crea un nuevo documento PDF
      let pageIndex = 1;
      let totalPages = 0;

      for (const pdfDoc of pdfDocs) {
        const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
        totalPages += copiedPages.length;
        copiedPages.forEach((page) => {
          mergedPdf.addPage(page); // Añade todas las páginas al documento unificado

          // Añadir el número de página en la esquina superior derecha
          const { width, height } = page.getSize();
          page.drawText(pageIndex.toString().padStart(3, '0'), {
            x: width - 50,
            y: height - 30,
            size: 12,
            color: rgb(0, 0, 0),
          });
          pageIndex++;
        });
      }

      const folderName = path.basename(dir); // Obtiene el nombre de la carpeta
      const mergedPdfName = `${folderName}_${totalPages.toString().padStart(3, '0')}.pdf`; // Construye el nombre del archivo PDF unificado
      const mergedPdfBytes = await mergedPdf.save(); // Guarda el documento unificado como un buffer
      const mergedPdfPath = path.join(dir, mergedPdfName); // Construye la ruta para el nuevo archivo PDF unificado
      await fs.writeFile(mergedPdfPath, mergedPdfBytes); // Escribe el nuevo archivo PDF unificado en el sistema de archivos

      generatedPdfsCount++; // Incrementa el contador de PDFs generados
      log(`Documento unificado guardado en::: ${mergedPdfPath}`); // Log del archivo generado
    }

    processedFilesCount = pdfDocs.length; // Incrementa el contador de archivos procesados
  } catch (error) {
    details.push(`Error unificando documentos en::: ${dir}: ${error}`); // Agrega el error al array de detalles
    console.error(`Error unificando documentos en::: ${dir}:`, error); // Muestra el error en la consola
  }
}

// Crea un servidor HTTP para recibir las solicitudes de procesamiento
const server = http.createServer(async (req, res) => {
  if (req.method === 'POST' && req.url.startsWith('/process-pdfs')) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const operation = url.searchParams.get('operation');
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString(); // Concatena los datos recibidos
    });
    req.on('end', async () => {
      const { path } = JSON.parse(body); // Parsea el JSON recibido
      const result = await processPDFs(path, operation); // Llama a la función processPDFs con la ruta y la operación
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

server.listen(3000, () => {
  console.log('Server listening on port 3000');
});
