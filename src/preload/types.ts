// src/preload/types.ts
import type {
  CanFrame,
  ParsedDbc,
  SerialPortOption,
  SlcanConnectOptions
} from '../shared/dbcTypes'

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

export type DbcParseResult =
  | { ok: true; dbc: ParsedDbc; path: string }
  | { ok: false; error: string }

export type CanConnectResult = { ok: true } | { ok: false; error: string }

export type CanSendResult = { ok: true } | { ok: false; error: string }

export interface AppAPI {
  windowControls: {
    minimize: () => Promise<void>
    toggleMaximize: () => Promise<boolean>
    close: () => Promise<void>
  }
  canBus: {
    listPorts: () => Promise<SerialPortOption[]>
    connect: (opts: SlcanConnectOptions) => Promise<CanConnectResult>
    disconnect: () => Promise<void>
    send: (payload: {
      id: number
      extended: boolean
      data: number[]
    }) => Promise<CanSendResult>
    onFrame: (cb: (frame: CanFrame) => void) => () => void
  }
  dbc: {
    openDialog: () => Promise<string | null>
    parseFile: (filePath: string) => Promise<DbcParseResult>
  }
}
