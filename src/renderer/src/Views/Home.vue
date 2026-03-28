<template>
  <div class="workspace">
    <header class="workspace-header">
      <h1 class="workspace-title">CAN（SLCAN 串口盒）</h1>
      <p class="workspace-sub">
        适用于 USB 转 CAN 且固件为 <strong>Lawicel SLCAN</strong>（常见 AT 命令：<code>O</code> 打开、<code>C</code> 关闭、<code>S0</code>–<code>S8</code> 波特率）。
        串口波特率多为 115200 或 500000，请与硬件一致。
      </p>
    </header>

    <section class="panel surface-card">
      <div class="row">
        <label class="lbl" for="portSel">串口</label>
        <select id="portSel" v-model="selectedPath" class="inp" :disabled="connected">
          <option v-if="ports.length === 0" value="">（未发现串口，请插拔设备后刷新）</option>
          <option v-for="p in ports" :key="p.path" :value="p.path">
            {{ p.friendlyName ? `${p.path} — ${p.friendlyName}` : p.path }}
          </option>
        </select>
        <button type="button" class="btn secondary" :disabled="connected" @click="refreshPorts">刷新</button>
      </div>
      <div class="row">
        <label class="lbl" for="baud">串口波特率</label>
        <select id="baud" v-model.number="baudRate" class="inp narrow" :disabled="connected">
          <option :value="9600">9600</option>
          <option :value="115200">115200</option>
          <option :value="500000">500000</option>
          <option :value="1000000">1000000</option>
        </select>
        <label class="lbl" for="br">CAN 速率</label>
        <select id="br" v-model="bitrateCode" class="inp narrow" :disabled="connected">
          <option v-for="o in bitrateOptions" :key="o.code" :value="o.code">
            {{ o.label }}
          </option>
        </select>
      </div>
      <div class="row actions">
        <button v-if="!connected" type="button" class="btn primary" :disabled="!selectedPath" @click="connect">
          连接
        </button>
        <button v-else type="button" class="btn danger" @click="disconnect">断开</button>
        <span :class="['status', connected ? 'on' : 'off']">{{ connected ? '已连接' : '未连接' }}</span>
      </div>
    </section>

    <section class="panel surface-card">
      <h2 class="h2">发送测试帧</h2>
      <div class="row">
        <label class="lbl" for="tid">帧 ID (hex)</label>
        <input id="tid" v-model="sendIdHex" class="inp narrow" placeholder="123" :disabled="!connected" />
        <label class="lbl"><input v-model="sendExt" type="checkbox" :disabled="!connected" /> 扩展帧</label>
      </div>
      <div class="row">
        <label class="lbl" for="td">数据 (hex，空格可选)</label>
        <input
          id="td"
          v-model="sendDataHex"
          class="inp grow"
          placeholder="01 02 03 04"
          :disabled="!connected"
        />
        <button type="button" class="btn primary" :disabled="!connected" @click="sendTest">发送</button>
      </div>
      <p v-if="sendError" class="err">{{ sendError }}</p>
    </section>

    <section class="panel surface-card log-card">
      <div class="log-head">
        <h2 class="h2">接收日志</h2>
        <button type="button" class="btn secondary small" @click="lines = []">清空</button>
      </div>
      <pre class="log">{{ logText }}</pre>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import type { CanFrame, SerialPortOption } from '@shared/dbcTypes'

const ports = ref<SerialPortOption[]>([])
const selectedPath = ref('')
const baudRate = ref(115200)
const bitrateCode = ref('S6')
const connected = ref(false)
const sendError = ref('')
const sendIdHex = ref('123')
const sendExt = ref(false)
const sendDataHex = ref('01 02 03 04')
const lines = ref<string[]>([])
let unsubFrame: (() => void) | null = null

const bitrateOptions = [
  { code: 'S0', label: 'S0 — 10 k' },
  { code: 'S1', label: 'S1 — 20 k' },
  { code: 'S2', label: 'S2 — 50 k' },
  { code: 'S3', label: 'S3 — 100 k' },
  { code: 'S4', label: 'S4 — 125 k' },
  { code: 'S5', label: 'S5 — 250 k' },
  { code: 'S6', label: 'S6 — 500 k' },
  { code: 'S7', label: 'S7 — 800 k' },
  { code: 'S8', label: 'S8 — 1 M' }
]

const logText = computed(() => (lines.value.length ? lines.value.join('\n') : '（无数据）'))

async function refreshPorts(): Promise<void> {
  const list = await window.api.canBus.listPorts()
  ports.value = list
  if (!selectedPath.value && list[0]) selectedPath.value = list[0].path
}

async function connect(): Promise<void> {
  sendError.value = ''
  const r = await window.api.canBus.connect({
    path: selectedPath.value,
    baudRate: baudRate.value,
    bitrateCode: bitrateCode.value
  })
  if (!r.ok) {
    sendError.value = r.error
    return
  }
  connected.value = true
  unsubFrame = window.api.canBus.onFrame((f: CanFrame) => {
    const hex = f.data.map((b) => b.toString(16).toUpperCase().padStart(2, '0')).join(' ')
    const line = `${new Date(f.ts).toLocaleTimeString()}  ${f.extended ? 'EXT' : 'STD'}  0x${f.id.toString(16).toUpperCase()}  [${f.dlc}]  ${hex}`
    lines.value = [...lines.value.slice(-199), line]
  })
}

async function disconnect(): Promise<void> {
  unsubFrame?.()
  unsubFrame = null
  await window.api.canBus.disconnect()
  connected.value = false
}

function parseHexBytes(s: string): number[] {
  const parts = s.trim().split(/\s+/)
  const out: number[] = []
  for (const p of parts) {
    if (!p) continue
    const n = Number.parseInt(p, 16)
    if (Number.isNaN(n) || n < 0 || n > 255) throw new Error(`非法字节: ${p}`)
    out.push(n)
  }
  return out
}

async function sendTest(): Promise<void> {
  sendError.value = ''
  try {
    const id = Number.parseInt(sendIdHex.value.replace(/^0x/i, ''), 16)
    if (Number.isNaN(id)) throw new Error('帧 ID 无效')
    const data = parseHexBytes(sendDataHex.value)
    const r = await window.api.canBus.send({ id, extended: sendExt.value, data })
    if (!r.ok) sendError.value = r.error
  } catch (e) {
    sendError.value = e instanceof Error ? e.message : String(e)
  }
}

onMounted(() => {
  void refreshPorts()
})

onUnmounted(() => {
  unsubFrame?.()
  unsubFrame = null
})
</script>

<style scoped>
.workspace {
  max-width: 960px;
}

.workspace-header {
  margin-bottom: 16px;
}

.workspace-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--app-text, #201f1e);
}

.workspace-sub {
  margin-top: 8px;
  font-size: 13px;
  line-height: 1.55;
  color: var(--app-text-muted, #605e5c);
}

.workspace-sub code {
  font-size: 12px;
  padding: 1px 4px;
  background: #edebe9;
  border-radius: 3px;
}

.surface-card {
  background: var(--app-surface, #fff);
  border: 1px solid var(--app-border, #edebe9);
  border-radius: 6px;
  padding: 14px 16px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.panel {
  margin-bottom: 14px;
}

.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.row:last-child {
  margin-bottom: 0;
}

.lbl {
  font-size: 13px;
  color: #605e5c;
  min-width: 72px;
}

.inp {
  min-width: 200px;
  height: 30px;
  border: 1px solid #8a8886;
  border-radius: 4px;
  padding: 0 8px;
  font-size: 13px;
}

.inp.narrow {
  min-width: 120px;
}

.inp.grow {
  flex: 1;
  min-width: 160px;
}

.btn {
  height: 30px;
  padding: 0 14px;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  border: 1px solid transparent;
}

.btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.btn.primary {
  background: #0f6cbd;
  color: #fff;
}

.btn.primary:hover:not(:disabled) {
  background: #115ea3;
}

.btn.secondary {
  background: #fff;
  border-color: #8a8886;
  color: #201f1e;
}

.btn.secondary:hover:not(:disabled) {
  background: #f3f2f1;
}

.btn.danger {
  background: #c50f1f;
  color: #fff;
}

.btn.small {
  height: 26px;
  padding: 0 10px;
  font-size: 12px;
}

.actions {
  margin-top: 4px;
}

.status {
  font-size: 13px;
  font-weight: 600;
}

.status.on {
  color: #107c10;
}

.status.off {
  color: #605e5c;
}

.h2 {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 10px;
  color: #201f1e;
}

.err {
  color: #c50f1f;
  font-size: 13px;
  margin-top: 6px;
}

.log-card {
  padding-bottom: 10px;
}

.log-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.log {
  margin: 0;
  max-height: 280px;
  overflow: auto;
  font-size: 12px;
  line-height: 1.45;
  font-family: ui-monospace, Consolas, monospace;
  background: #faf9f8;
  border: 1px solid #edebe9;
  border-radius: 4px;
  padding: 8px 10px;
  color: #201f1e;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
