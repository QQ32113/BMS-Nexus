/** 与 DBC 解析、界面展示共享的类型 */

export interface DbcSignal {
  name: string
  startBit: number
  bitLength: number
  /** 1 = intel (little-endian), 0 = motorola */
  byteOrder: 0 | 1
  signed: boolean
  factor: number
  offset: number
  min: number
  max: number
  unit: string
  receivers: string
}

export interface DbcMessage {
  /** 标准帧 11 位 ID */
  id: number
  name: string
  dlc: number
  transmitter: string
  signals: DbcSignal[]
}

export interface ParsedDbc {
  version: string
  messages: DbcMessage[]
}

export interface CanFrame {
  id: number
  extended: boolean
  dlc: number
  data: number[]
  /** 主进程时间戳 ms */
  ts: number
}

export interface SerialPortOption {
  path: string
  friendlyName?: string
}

export interface SlcanConnectOptions {
  path: string
  baudRate: number
  /** Lawicel SLCAN: S0=10k … S8=1M */
  bitrateCode: string
}
