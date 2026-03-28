import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { AppAPI } from './types'
import type { CanFrame } from '../shared/dbcTypes'

const api: AppAPI = {
  windowControls: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    toggleMaximize: () => ipcRenderer.invoke('window:toggle-maximize') as Promise<boolean>,
    close: () => ipcRenderer.invoke('window:close')
  },
  canBus: {
    listPorts: () => ipcRenderer.invoke('serial:list'),
    connect: (opts) => ipcRenderer.invoke('can:connect', opts),
    disconnect: () => ipcRenderer.invoke('can:disconnect'),
    send: (payload) => ipcRenderer.invoke('can:send', payload),
    onFrame: (cb: (frame: CanFrame) => void) => {
      const listener = (_event: unknown, data: CanFrame): void => {
        cb(data)
      }
      ipcRenderer.on('can:frame', listener)
      return () => {
        ipcRenderer.removeListener('can:frame', listener)
      }
    }
  },
  dbc: {
    openDialog: () => ipcRenderer.invoke('dbc:openDialog'),
    parseFile: (filePath) => ipcRenderer.invoke('dbc:parseFile', filePath)
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-expect-error preload
  window.electron = electronAPI
  // @ts-expect-error preload
  window.api = api
}
