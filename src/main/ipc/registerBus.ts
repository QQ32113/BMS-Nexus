import { app, BrowserWindow, dialog, ipcMain } from 'electron'
import type { SlcanConnectOptions } from '../../shared/dbcTypes'
import { parseDbcFile } from '../lib/dbcParser'
import { SlcanSession } from '../lib/slcanSession'

export function registerBusIpc(getWindow: () => BrowserWindow | null): void {
  let session: SlcanSession | null = null

  const pushFrame = (payload: unknown): void => {
    const w = getWindow()
    if (w && !w.isDestroyed()) w.webContents.send('can:frame', payload)
  }

  ipcMain.handle('serial:list', async () => {
    const { SerialPort } = await import('serialport')
    const ports = await SerialPort.list()
    return ports.map((p) => ({
      path: p.path,
      friendlyName: p.friendlyName ?? p.manufacturer ?? ''
    }))
  })

  ipcMain.handle('can:connect', async (_e, opts: SlcanConnectOptions) => {
    try {
      await session?.close()
      session = new SlcanSession(pushFrame)
      await session.open(opts.path, opts.baudRate, opts.bitrateCode)
      return { ok: true as const }
    } catch (err) {
      session = null
      return { ok: false as const, error: err instanceof Error ? err.message : String(err) }
    }
  })

  ipcMain.handle('can:disconnect', async () => {
    try {
      await session?.close()
    } finally {
      session = null
    }
  })

  ipcMain.handle(
    'can:send',
    async (_e, payload: { id: number; extended: boolean; data: number[] }) => {
      try {
        if (!session?.connected) return { ok: false as const, error: '未连接' }
        await session.sendFrame(payload.id, payload.extended, payload.data)
        return { ok: true as const }
      } catch (err) {
        return { ok: false as const, error: err instanceof Error ? err.message : String(err) }
      }
    }
  )

  ipcMain.handle('dbc:openDialog', async () => {
    const w = getWindow()
    const opts = {
      title: '选择 DBC 文件',
      filters: [{ name: 'DBC', extensions: ['dbc'] }, { name: '所有文件', extensions: ['*'] }],
      properties: ['openFile' as const]
    }
    const r = w ? await dialog.showOpenDialog(w, opts) : await dialog.showOpenDialog(opts)
    if (r.canceled || !r.filePaths[0]) return null
    return r.filePaths[0]
  })

  ipcMain.handle('dbc:parseFile', async (_e, filePath: string) => {
    try {
      const dbc = await parseDbcFile(filePath)
      return { ok: true as const, dbc, path: filePath }
    } catch (err) {
      return {
        ok: false as const,
        error: err instanceof Error ? err.message : String(err)
      }
    }
  })

  app.on('before-quit', () => {
    void session?.close()
  })
}
