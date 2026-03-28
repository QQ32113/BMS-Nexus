import { readFile } from 'fs/promises'
import type { DbcMessage, DbcSignal, ParsedDbc } from '../../shared/dbcTypes'

const BO_RE = /^\s*BO_\s+(\d+)\s+(\w+)\s*:\s*(\d+)\s+(\w+)/
const SG_RE =
  /^\s*SG_\s+(\w+)\s*:\s*(\d+)\|(\d+)@([01])([+-])\s*\(([^,]+),([^)]+)\)\s*\[([^|]*)\|([^\]]*)\]\s*"([^"]*)"\s*(.*)$/

function parseNum(s: string): number {
  const t = s.trim()
  if (t === '') return 0
  return Number.parseFloat(t)
}

export function parseDbcText(content: string): ParsedDbc {
  const lines = content.split(/\r?\n/)
  let version = ''
  const messages: DbcMessage[] = []
  let current: DbcMessage | null = null

  for (const line of lines) {
    const v = line.match(/^\s*VERSION\s+"(.*)"/)
    if (v) {
      version = v[1] ?? ''
      continue
    }

    const bo = line.match(BO_RE)
    if (bo) {
      const id = Number.parseInt(bo[1]!, 10)
      const name = bo[2]!
      const dlc = Number.parseInt(bo[3]!, 10)
      const transmitter = bo[4]!
      current = { id, name, dlc, transmitter, signals: [] }
      messages.push(current)
      continue
    }

    const sg = line.match(SG_RE)
    if (sg && current) {
      const signal: DbcSignal = {
        name: sg[1]!,
        startBit: Number.parseInt(sg[2]!, 10),
        bitLength: Number.parseInt(sg[3]!, 10),
        byteOrder: (sg[4] === '1' ? 1 : 0) as 0 | 1,
        signed: sg[5] === '-',
        factor: parseNum(sg[6]!),
        offset: parseNum(sg[7]!),
        min: parseNum(sg[8]!),
        max: parseNum(sg[9]!),
        unit: sg[10] ?? '',
        receivers: (sg[11] ?? '').trim()
      }
      current.signals.push(signal)
    }
  }

  return { version, messages }
}

export async function parseDbcFile(filePath: string): Promise<ParsedDbc> {
  const content = await readFile(filePath, 'utf-8')
  return parseDbcText(content)
}
