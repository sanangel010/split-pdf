const { app, BrowserWindow, ipcMain, dialog } = require('electron'); // Importa los módulos necesarios de Electron
const path = require('path'); // Importa el módulo path para manejar rutas
const http = require('http'); // Importa el módulo http para crear un servidor
const fs = require('fs-extra'); // Importa fs-extra para trabajar con el sistema de archivos
const { PDFDocument } = require('pdf-lib'); // Importa PDFDocument de pdf-lib para manipular PDFs

// Función para crear la ventana de la aplicación
function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
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

// Función principal para procesar PDFs y separar sus páginas
async function processPDFs(directoryPath) {
  let processedFilesCount = 0;
  let generatedPdfsCount = 0;
  const details = [];

  // Función recursiva para procesar un directorio y sus subdirectorios
  async function processDirectory(dir) {
    const files = await fs.readdir(dir); // Lee los contenidos del directorio

    for (const file of files) {
      const fullPath = path.join(dir, file); // Construye la ruta completa del archivo o directorio
      const stat = await fs.stat(fullPath); // Obtiene información sobre el archivo o directorio

      if (stat.isDirectory()) {
        await processDirectory(fullPath); // Si es un directorio, llama recursivamente a processDirectory
      } else if (path.extname(file).toLowerCase() === '.pdf') {
        await processPDF(fullPath); // Si es un archivo PDF, llama a processPDF
      }
    }
  }

  // Función para procesar un archivo PDF y separar sus páginas
  async function processPDF(filePath) {
    try {
      const log = message => {
        details.push(message); // Agrega el mensaje al array de detalles
        console.log(message); // También lo muestra en la consola para depuración
      };

      log(`Procesando::: ${filePath}`); // Log del inicio del procesamiento
      const pdfBuffer = await fs.readFile(filePath); // Lee el archivo PDF como un buffer
      const pdfDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true }); // Carga el PDF en pdf-lib ignorando la encriptación
      const pdfName = path.basename(filePath, '.pdf'); // Obtiene el nombre del archivo sin la extensión

      const pageCount = pdfDoc.getPageCount(); // Obtiene el número de páginas del PDF

      if (pageCount > 1) { // Solo procesar si el PDF tiene más de una página
        for (let i = 0; i < pageCount; i++) {
          const newPdfDoc = await PDFDocument.create(); // Crea un nuevo documento PDF
          const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [i]); // Copia la página i del documento original
          newPdfDoc.addPage(copiedPage); // Añade la página copiada al nuevo documento PDF

          const newPdfBytes = await newPdfDoc.save(); // Guarda el nuevo documento PDF como un buffer
          const newPdfPath = path.join(path.dirname(filePath), `${pdfName}_pagina${i + 1}.pdf`); // Construye la ruta para el nuevo archivo PDF
          await fs.writeFile(newPdfPath, newPdfBytes); // Escribe el nuevo archivo PDF en el sistema de archivos

          generatedPdfsCount++; // Incrementa el contador de PDFs generados
          log(`Pagina ${i + 1} de ${filePath} guardado en::: ${newPdfPath}`); // Log del archivo generado
        }
      } else {
        log(`Se brinca documento de una página PDF: ${filePath}`); // Log de archivos de una sola página
      }

      processedFilesCount++; // Incrementa el contador de archivos procesados
    } catch (error) {
      details.push(`Error procesando::: ${filePath}: ${error}`); // Agrega el error al array de detalles
      console.error(`Error procesando::: ${filePath}:`, error); // Muestra el error en la consola
    }
  }

  await processDirectory(directoryPath); // Llama a processDirectory para empezar el procesamiento desde el directorio raíz

  return { processedFilesCount, generatedPdfsCount, details }; // Devuelve el resultado del procesamiento
}

// Crea un servidor HTTP para recibir las solicitudes de procesamiento
const server = http.createServer(async (req, res) => {
  if (req.method === 'POST' && req.url === '/process-pdfs') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString(); // Concatena los datos recibidos
    });
    req.on('end', async () => {
      const { path } = JSON.parse(body); // Parsea el JSON recibido
      const result = await processPDFs(path); // Procesa los PDFs en la ruta especificada
      res.writeHead(200, { 'Content-Type': 'application/json' }); // Configura la cabecera de la respuesta
      res.end(JSON.stringify(result)); // Envía el resultado como JSON
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' }); // Configura la cabecera para un 404
    res.end('Not Found'); // Envía el mensaje 404
  }
});

// El servidor escucha en el puerto 3000
server.listen(3000, () => {
  console.log('Server running on port 3000');
});
