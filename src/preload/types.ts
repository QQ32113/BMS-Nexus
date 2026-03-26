// src/preload/types.ts
export type IpcListener = (data: unknown) => void

export interface ElectronAPI {
  ipcRenderer: {
    send: (channel: string, data?: unknown) => void
    on: (channel: string, callback: IpcListener) => () => void
    invoke: <T = unknown>(channel: string, data?: unknown) => Promise<T>
  }
  versions: {
    node: string
    chrome: string
    electron: string
  }
}
