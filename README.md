# Procesador de Archivos PDF

## Instalación

1. Clona el repositorio:
```sh
   git clone https://github.com/sanangel010/split-pdf.git
   cd split-pdf
```

2. Instala las dependencias:
```sh
   npm install
```

## Ejemplo de ejecución desde la línea de comandos
Para ejecutar el script directamente desde la línea de comandos, usa:
   node app2.js /Users/usuario/CarpetaPDF

El script incluye manejo de errores para archivos PDF individuales. Si ocurre un error al procesar un PDF específico, el script registrará el mensaje de error en la consola y continuará procesando los archivos restantes.

## Descripción 
Este aplicativo procesará todos los archivos PDF en el directorio que se indique como argumento del script. El script creará nuevos archivos PDF para cada página en el mismo directorio.

## Salida
El script mostrará mensajes en la consola indicando el progreso del proceso. Para cada archivo PDF, imprimirá:
- El archivo que se está procesando
- El número de página y la ruta del nuevo archivo PDF creado para cada página

## Manejo de Errores
El script maneja errores para archivos PDF individuales. Si ocurre un error al procesar un PDF específico, el script registrará el mensaje de error y continuará procesando los archivos restantes.

## Notas
- El script asume que los archivos PDF no están encriptados. Si tienes archivos PDF encriptados, deberás proporcionar la contraseña a la función PDFDocument.load().
- El script creará nuevos archivos PDF en el mismo directorio que los archivos PDF originales.
- El script sobrescribirá archivos existentes con el mismo nombre.

## Uso de la Interfaz Gráfica con Electron

### Ejecución en modo desarrollo
Para ejecutar la aplicación con una interfaz gráfica en modo desarrollo:
```sh
   npm start
```

### Generación del ejecutable con Electron
1. Instalar electron-packager como dependencia de desarrollo:
```sh
   npm install electron-packager --save-dev
```

2. Empaquetar la aplicación para la plataforma de Windows:
```sh
   npm run package
```
## Autor
Mtro. José Ángel Haro Juárez

## Fecha
20/06/2024
