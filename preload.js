const { contextBridge, ipcRenderer } = require('electron'); // Importa los módulos necesarios de Electron

// Exponer funciones seguras a la ventana de renderizado
contextBridge.exposeInMainWorld('electron', {
  selectDirectory: () => ipcRenderer.invoke('select-directory') // Función para seleccionar directorio
});
