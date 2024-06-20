/*
*By: Mtro. José Ángel Haro Juárez
Date: 20/06/2024
Desc: Aplicación de consola que permite recibir una ubicación fisica de archivos pdf,
y barre en todos los niveles de carpeta para que cada arhvivo se parta en un nuevo pdf
de  tal manera que cada pagína se convierta en un nuevo pdf.
*/

const fs = require('fs-extra'); // Importa la biblioteca fs-extra para trabajar con el sistema de archivos
const path = require('path'); // Importa la biblioteca path para manejar rutas de archivos y directorios
const { PDFDocument } = require('pdf-lib'); // Importa PDFDocument de pdf-lib para manipular PDFs

// Variables globales para contar archivos procesados y PDFs generados
let processedFilesCount = 0;
let generatedPdfsCount = 0;

// Función principal para procesar PDFs y separar sus páginas
async function processPDFs(directoryPath) {
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
      console.log(`Procesando::: ${filePath}`); // Imprime en la consola el archivo que se está procesando
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
          console.log(`Pagina ${i + 1} de ${filePath} guardado en::: ${newPdfPath}`); // Imprime en la consola que la página ha sido guardada
        }
      } else {
        console.log(`Se brinca documento de una página PDF: ${filePath}`); // Imprime un mensaje si el PDF tiene solo una página
      }

      processedFilesCount++; // Incrementa el contador de archivos procesados
    } catch (error) {
      console.error(`Error procesando::: ${filePath}:`, error); // Manejo de errores específico para archivos PDF individuales
    }
  }

  await processDirectory(directoryPath); // Llama a processDirectory para empezar el procesamiento desde el directorio raíz
}

// Obtener la ruta desde los argumentos de la línea de comandos
const directoryPath = process.argv[2]; // Toma el primer argumento de la línea de comandos como la ruta del directorio

if (!directoryPath) { // Si no se proporciona una ruta
  console.error('El path de ubicación de los documentos es requerido..'); // Muestra un mensaje de error en la consola
  process.exit(1); // Sale del proceso con un código de error
}

processPDFs(directoryPath) // Llama a la función principal para procesar los PDFs
  .then(() => {
    console.log('Todos los PDF han sido procesados..'); // Imprime un mensaje cuando se han procesado todos los PDFs
    console.log(`Archivos PDF procesados: ${processedFilesCount}`); // Imprime la cantidad de archivos procesados
    console.log(`Cantidad de paginas de archivos PDF creados::: ${generatedPdfsCount}`); // Imprime la cantidad de nuevos PDFs generados
  })
  .catch(err => console.error('Error procesando los PDFs:', err)); // Imprime un mensaje de error si ocurre algún problema