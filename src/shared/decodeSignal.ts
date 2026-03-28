import type { DbcSignal } from './dbcTypes'

function readBitsIntel(data: Uint8Array, startBit: number, bitLength: number): number {
  let value = 0
  for (let i = 0; i < bitLength; i++) {
    const bitIndex = startBit + i
    const byteIndex = Math.floor(bitIndex / 8)
    const bitInByte = bitIndex % 8
    if (byteIndex >= data.length) break
    const bit = (data[byteIndex]! >> bitInByte) & 1
    value |= bit << i
  }
  return value
}

function readBitsMotorola(data: Uint8Array, startBit: number, bitLength: number): number {
  let value = 0
  for (let i = 0; i < bitLength; i++) {
    const bitIndex = startBit - i
    const byteIndex = Math.floor(bitIndex / 8)
    const bitInByte = bitIndex % 8
    if (byteIndex < 0 || byteIndex >= data.length) break
    const bit = (data[byteIndex]! >> bitInByte) & 1
    value = (value << 1) | bit
  }
  return value
}

export function decodeSignalValue(data: Uint8Array, signal: DbcSignal): number {
  const raw =
    signal.byteOrder === 1
      ? readBitsIntel(data, signal.startBit, signal.bitLength)
      : readBitsMotorola(data, signal.startBit, signal.bitLength)
  let physical = raw
  if (signal.signed && signal.bitLength > 0) {
    const signBit = 1 << (signal.bitLength - 1)
    if (raw & signBit) {
      physical = raw - (1 << signal.bitLength)
    }
  }
  return physical * signal.factor + signal.offset
}
