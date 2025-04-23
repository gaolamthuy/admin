const { contextBridge, ipcRenderer } = require('electron');

// Simplify the preload script to avoid potential issues
contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    send: (channel, data) => {
      // whitelist channels
      const validChannels = ['print-invoice'];
      if (validChannels.includes(channel)) {
        ipcRenderer.send(channel, data);
      }
    },
    on: (channel, func) => {
      const validChannels = ['print-response'];
      if (validChannels.includes(channel)) {
        // Remove any old listeners
        ipcRenderer.removeAllListeners(channel);
        // Add the new listener
        ipcRenderer.on(channel, (event, ...args) => func(...args));
      }
    },
    removeAllListeners: (channel) => {
      const validChannels = ['print-response'];
      if (validChannels.includes(channel)) {
        ipcRenderer.removeAllListeners(channel);
      }
    }
  }
});