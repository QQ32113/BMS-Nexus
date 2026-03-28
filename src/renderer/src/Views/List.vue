<template>
  <div class="dbc-page">
    <header class="dbc-header">
      <h1 class="dbc-title">DBC 解析</h1>
      <p class="dbc-sub">打开 Vector / CANdb++ 风格 DBC，解析 <code>BO_</code> / <code>SG_</code>。连接 CAN 后可在下方查看与报文 ID 匹配的信号物理量（近似解码）。</p>
    </header>

    <section class="toolbar surface-card">
      <button type="button" class="btn primary" @click="openDbc">打开 DBC 文件…</button>
      <span v-if="dbcPath" class="path" :title="dbcPath">{{ dbcPath }}</span>
      <span v-if="dbcVersion" class="ver">VERSION "{{ dbcVersion }}"</span>
      <p v-if="parseError" class="err">{{ parseError }}</p>
    </section>

    <section v-if="messages.length" class="surface-card table-wrap">
      <table class="grid">
        <thead>
          <tr>
            <th>ID (hex)</th>
            <th>名称</th>
            <th>DLC</th>
            <th>信号数</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="m in messages" :key="m.id + m.name">
            <td>0x{{ m.id.toString(16).toUpperCase() }}</td>
            <td>{{ m.name }}</td>
            <td>{{ m.dlc }}</td>
            <td>{{ m.signals.length }}</td>
          </tr>
        </tbody>
      </table>
    </section>

    <section v-if="messages.length" class="surface-card">
      <h2 class="h2">信号明细</h2>
      <div v-for="m in messages" :key="'sig-' + m.id" class="msg-block">
        <div class="msg-title">0x{{ m.id.toString(16).toUpperCase() }} — {{ m.name }}</div>
        <table class="grid small">
          <thead>
            <tr>
              <th>信号</th>
              <th>起始位</th>
              <th>长度</th>
              <th>序</th>
              <th>factor / offset</th>
              <th>单位</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in m.signals" :key="m.id + s.name">
              <td>{{ s.name }}</td>
              <td>{{ s.startBit }}</td>
              <td>{{ s.bitLength }}</td>
              <td>{{ s.byteOrder === 1 ? 'Intel' : 'Motorola' }}</td>
              <td>{{ s.factor }} / {{ s.offset }}</td>
              <td>{{ s.unit || '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="surface-card live">
      <h2 class="h2">最近匹配帧（需先在「工作区 / 首页」连接 CAN）</h2>
      <p v-if="!lastFrame" class="muted">尚未收到帧或未加载 DBC。</p>
      <div v-else class="live-block">
        <div class="live-line">
          <strong>0x{{ lastFrame.id.toString(16).toUpperCase() }}</strong>
          <span>{{ lastFrame.extended ? 'EXT' : 'STD' }}</span>
          <span>数据 {{ frameDataHex }}</span>
        </div>
        <div v-if="decodedRows.length" class="decoded">
          <div v-for="row in decodedRows" :key="row.name" class="dec-row">
            <span class="sn">{{ row.name }}</span>
            <span class="sv">{{ row.value.toFixed(4) }}</span>
            <span class="su">{{ row.unit }}</span>
          </div>
        </div>
        <p v-else-if="lastFrame" class="muted">当前 ID 在 DBC 中无定义或无信号。</p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import type { CanFrame, DbcMessage } from '@shared/dbcTypes'
import { decodeSignalValue } from '@shared/decodeSignal'

const dbcPath = ref('')
const dbcVersion = ref('')
const messages = ref<DbcMessage[]>([])
const parseError = ref('')
const lastFrame = ref<CanFrame | null>(null)
let unsub: (() => void) | null = null

const idToMessage = computed(() => {
  const map = new Map<number, DbcMessage>()
  for (const m of messages.value) map.set(m.id, m)
  return map
})

const decodedRows = computed(() => {
  const f = lastFrame.value
  if (!f) return []
  const msg = idToMessage.value.get(f.id)
  if (!msg) return []
  const u8 = new Uint8Array(f.data)
  return msg.signals.map((s) => ({
    name: s.name,
    value: decodeSignalValue(u8, s),
    unit: s.unit || ''
  }))
})

const frameDataHex = computed(() => {
  const f = lastFrame.value
  if (!f) return ''
  return f.data.map((b) => b.toString(16).toUpperCase().padStart(2, '0')).join(' ')
})

watch(
  () => messages.value.length,
  () => {
    lastFrame.value = null
  }
)

async function openDbc(): Promise<void> {
  parseError.value = ''
  const path = await window.api.dbc.openDialog()
  if (!path) return
  const r = await window.api.dbc.parseFile(path)
  if (!r.ok) {
    parseError.value = r.error
    dbcPath.value = ''
    messages.value = []
    dbcVersion.value = ''
    return
  }
  dbcPath.value = r.path
  dbcVersion.value = r.dbc.version
  messages.value = r.dbc.messages
}

onMounted(() => {
  unsub = window.api.canBus.onFrame((f: CanFrame) => {
    lastFrame.value = f
  })
})

onUnmounted(() => {
  unsub?.()
  unsub = null
})
</script>

<style scoped>
.dbc-page {
  max-width: 1000px;
}

.dbc-header {
  margin-bottom: 12px;
}

.dbc-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--app-text, #201f1e);
}

.dbc-sub {
  margin-top: 6px;
  font-size: 13px;
  color: var(--app-text-muted, #605e5c);
  line-height: 1.5;
}

.dbc-sub code {
  font-size: 12px;
  padding: 1px 4px;
  background: #edebe9;
  border-radius: 3px;
}

.surface-card {
  background: var(--app-surface, #fff);
  border: 1px solid var(--app-border, #edebe9);
  border-radius: 6px;
  padding: 12px 14px;
  margin-bottom: 12px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.path {
  font-size: 12px;
  color: #605e5c;
  max-width: 480px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ver {
  font-size: 12px;
  color: #107c10;
}

.btn {
  height: 30px;
  padding: 0 14px;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  border: none;
  background: #0f6cbd;
  color: #fff;
}

.btn:hover {
  background: #115ea3;
}

.err {
  color: #c50f1f;
  font-size: 13px;
  width: 100%;
}

.table-wrap {
  overflow: auto;
}

.grid {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.grid th,
.grid td {
  border: 1px solid #edebe9;
  padding: 6px 8px;
  text-align: left;
}

.grid thead {
  background: #faf9f8;
}

.grid.small {
  font-size: 12px;
  margin-bottom: 12px;
}

.msg-block {
  margin-bottom: 16px;
}

.msg-title {
  font-weight: 600;
  margin-bottom: 6px;
  font-size: 13px;
}

.h2 {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 10px;
}

.muted {
  font-size: 13px;
  color: #605e5c;
}

.live-line {
  font-size: 13px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 8px;
  font-family: ui-monospace, Consolas, monospace;
}

.decoded {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.dec-row {
  display: grid;
  grid-template-columns: 1fr 120px 48px;
  gap: 8px;
  font-size: 13px;
}

.sn {
  font-weight: 500;
}

.sv {
  font-family: ui-monospace, Consolas, monospace;
}

.su {
  color: #605e5c;
}
</style>
