### Procesador de Archivos PDF

## Instalación

1. Clona el repositorio:
   ```sh
   git clone https://github.com/sanangel010/split-pdf.git
   cd split-pdf

2. Instala las dependencias:
   ```sh
   npm install

## Ejemplo de ejecución:
node app2.js /Users/usuario/CarpetaPDF

El script incluye manejo de errores para archivos PDF individuales. Si ocurre un error al procesar un PDF específico, el script registrará el mensaje de error en la consola y continuará procesando los archivos restantes.


## Descripción: 
Este aplicativo procesará todos los archivos PDF en el directorio que se indique como argumento del script. El script y creará nuevos archivos PDF para cada página en el mismo directorio.

## Salida:
El script mostrará mensajes en la consola indicando el progreso del proceso. Para cada archivo PDF, imprimirá:

El archivo que se está procesando
El número de página y la ruta del nuevo archivo PDF creado para cada página
Manejo de Errores:


## Notas:
El script asume que los archivos PDF no están encriptados. Si tienes archivos PDF encriptados, deberás proporcionar la contraseña a la función PDFDocument.load().
El script creará nuevos archivos PDF en el mismo directorio que los archivos PDF originales.
El script sobrescribirá archivos existentes con el mismo nombre.

## Autor:
Mtro. José Ángel Haro Juárez

## Fecha:
20/06/2024