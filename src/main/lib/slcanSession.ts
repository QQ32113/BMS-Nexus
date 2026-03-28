import type { CanFrame } from '../../shared/dbcTypes'

type SerialPortType = import('serialport').SerialPort

export class SlcanSession {
  private port: SerialPortType | null = null
  private buffer = ''
  private readonly onFrame: (f: CanFrame) => void

  constructor(onFrame: (f: CanFrame) => void) {
    this.onFrame = onFrame
  }

  get connected(): boolean {
    return this.port !== null && this.port.isOpen
  }

  async open(path: string, baudRate: number, bitrateCode: string): Promise<void> {
    await this.close()
    const { SerialPort } = await import('serialport')
    const port = new SerialPort({ path, baudRate, autoOpen: false })
    await new Promise<void>((resolve, reject) => {
      port.open((err) => (err ? reject(err) : resolve()))
    })
    this.port = port
    this.buffer = ''
    port.on('data', (chunk: Buffer | string) => this.appendChunk(chunk))
    port.on('error', (err) => console.error('[slcan]', err))
    await this.writeRaw('C\r')
    await this.delay(20)
    await this.writeRaw(`${bitrateCode}\r`)
    await this.delay(20)
    await this.writeRaw('O\r')
    await this.delay(20)
  }

  private delay(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms))
  }

  private async writeRaw(s: string): Promise<void> {
    const p = this.port
    if (!p) throw new Error('port closed')
    await new Promise<void>((resolve, reject) => {
      p.write(Buffer.from(s, 'ascii'), (err) => (err ? reject(err) : resolve()))
    })
  }

  private appendChunk(chunk: Buffer | string): void {
    this.buffer += typeof chunk === 'string' ? chunk : chunk.toString('ascii')
    let idx: number
    while ((idx = this.buffer.indexOf('\r')) >= 0) {
      const line = this.buffer.slice(0, idx).trim()
      this.buffer = this.buffer.slice(idx + 1)
      if (line.length > 0) this.parseLine(line)
    }
  }

  private parseLine(line: string): void {
    const ts = Date.now()
    const head = line[0]
    if (head === 't' && line.length >= 5) {
      const id = Number.parseInt(line.slice(1, 4), 16)
      const dlc = Number.parseInt(line[4]!, 16)
      const hexData = line.slice(5, 5 + dlc * 2)
      if (hexData.length !== dlc * 2) return
      const data: number[] = []
      for (let i = 0; i < dlc; i++) {
        data.push(Number.parseInt(hexData.slice(i * 2, i * 2 + 2), 16))
      }
      this.onFrame({ id, extended: false, dlc, data, ts })
      return
    }
    if (head === 'T' && line.length >= 10) {
      const id = Number.parseInt(line.slice(1, 9), 16)
      const dlc = Number.parseInt(line[9]!, 16)
      if (line.length < 10 + dlc * 2) return
      const hexData = line.slice(10, 10 + dlc * 2)
      if (hexData.length !== dlc * 2) return
      const data: number[] = []
      for (let i = 0; i < dlc; i++) {
        data.push(Number.parseInt(hexData.slice(i * 2, i * 2 + 2), 16))
      }
      this.onFrame({ id, extended: true, dlc, data, ts })
    }
  }

  async sendFrame(id: number, extended: boolean, data: number[]): Promise<void> {
    const p = this.port
    if (!p?.isOpen) throw new Error('未连接')
    const dlc = Math.min(8, data.length)
    const payload = data.slice(0, dlc)
    while (payload.length < dlc) payload.push(0)
    let line: string
    if (extended) {
      const idHex = id.toString(16).toUpperCase().padStart(8, '0')
      const hex = payload.map((b) => b.toString(16).toUpperCase().padStart(2, '0')).join('')
      line = `T${idHex}${dlc.toString(16).toUpperCase()}${hex}\r`
    } else {
      const idHex = (id & 0x7ff).toString(16).toUpperCase().padStart(3, '0')
      const hex = payload.map((b) => b.toString(16).toUpperCase().padStart(2, '0')).join('')
      line = `t${idHex}${dlc.toString(16).toUpperCase()}${hex}\r`
    }
    await this.writeRaw(line)
  }

  async close(): Promise<void> {
    const p = this.port
    this.port = null
    if (!p) return
    try {
      if (p.isOpen) {
        await new Promise<void>((resolve) => {
          p.write(Buffer.from('C\r', 'ascii'), () => resolve())
        })
        await new Promise<void>((resolve, reject) => {
          p.close((err) => (err ? reject(err) : resolve()))
        })
      }
    } catch {
      /* ignore */
    }
  }
}
