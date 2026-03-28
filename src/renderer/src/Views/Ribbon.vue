<template>
  <div class="ribbon-root">
    <!-- 一级标签栏 -->
    <div class="ribbon-tabs">
      <button
        v-for="tab in tabs"
        :key="tab"
        :class="['ribbon-tab', { active: tab === activeTab }]"
        @click="selectTab(tab)"
      >
        {{ tab }}
      </button>
    </div>
    <!-- 二级工具栏 -->
    <div class="ribbon-toolbar">
      <div v-for="tool in toolbars[activeTab]" :key="tool.label" class="dropdown">
        <button class="toolbar-btn dropdown-trigger" @click="handleToolClick(tool)">
          <span class="toolbar-main">
            <img v-if="tool.icon" :src="tool.icon" class="toolbar-icon" />
            <span class="toolbar-label">{{ tool.label }}</span>
            <span v-if="hasDropdown(tool.label)" class="dropdown-indicator" />
          </span>
        </button>
        <div v-if="hasDropdown(tool.label) && openDropdown === tool.label" class="dropdown-menu">
          <button
            v-for="item in getMenuItems(tool)"
            :key="item.label"
            class="dropdown-item"
            @click="handleMenuItemClick(item)"
          >
            <img v-if="item.icon" :src="item.icon" class="toolbar-icon" />
            {{ item.label }}
          </button>
        </div>
      </div>
    </div>
    <div v-if="showStartDialog" class="dialog-mask" @click.self="closeStartDialog">
      <div
        :class="['start-dialog', { maximized: isDialogMaximized, minimized: isDialogMinimized }]"
      >
        <div class="start-dialog-header">
          <span>启动配置</span>
          <div class="window-controls">
            <button class="window-btn" title="最小化" @click="minimizeDialog">
              <span class="icon-minimize" />
            </button>
            <button
              class="window-btn"
              :title="isDialogMaximized ? '还原' : '最大化'"
              @click="toggleMaximizeDialog"
            >
              <span :class="isDialogMaximized ? 'icon-restore' : 'icon-maximize'" />
            </button>
            <button class="window-btn close" title="关闭" @click="closeStartDialog">
              <span class="icon-close" />
            </button>
          </div>
        </div>
        <div v-show="!isDialogMinimized" class="start-dialog-content">
          <aside class="model-list">
            <div class="list-title">CAN 硬件型号</div>
            <button
              v-for="model in canModels"
              :key="model.id"
              :class="['model-item', { active: model.id === selectedModelId }]"
              @click="selectedModelId = model.id"
            >
              {{ model.name }}
            </button>
          </aside>
          <section class="channel-panel">
            <div class="panel-title">通道选择（型号与通道一一对应）</div>
            <div class="channel-row">
              <span class="row-label">当前型号</span>
              <span class="row-value">{{ selectedModel?.name ?? '-' }}</span>
            </div>
            <div class="channel-row">
              <label class="row-label" for="channelSelect">当前通道</label>
              <select
                id="channelSelect"
                v-model="selectedChannelByModel[selectedModelId]"
                class="channel-select"
              >
                <option
                  v-for="channel in selectedModel?.channels ?? []"
                  :key="channel"
                  :value="channel"
                >
                  {{ channel }}
                </option>
              </select>
            </div>
            <div class="mapping-preview">
              <div class="preview-title">当前映射</div>
              <div v-for="model in canModels" :key="`map-${model.id}`" class="preview-item">
                <span>{{ model.name }}</span>
                <span>{{ selectedChannelByModel[model.id] ?? '-' }}</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { icons } from '../assets/icons'

const tabs = ['分析', '硬件', '设计', '仿真', '代码生成', '测试', '应用', '工具']
const activeTab = ref(tabs[0])
type ToolItem = { label: string; icon: string }
type ToolbarMap = Record<string, ToolItem[]>
type DropdownMap = Record<string, ToolItem[]>
type CanModel = { id: string; name: string; channels: string[] }

const toolbars: ToolbarMap = {
  分析: [
    { label: '启动', icon: icons.startIcon },
    { label: '全仿真模式', icon: '' },
    { label: '测量设置', icon: '' },
    { label: '系统消息', icon: '' }
  ],
  硬件: [{ label: '硬件配置', icon: '' }],
  设计: [{ label: '设计工具', icon: '' }],
  仿真: [{ label: '仿真设置', icon: '' }],
  代码生成: [{ label: '生成代码', icon: '' }],
  测试: [{ label: '测试用例', icon: '' }],
  应用: [{ label: '应用管理', icon: '' }],
  工具: [
    { label: '工具箱', icon: icons.toolMenuIcon },
    { label: 'DBC', icon: icons.dbcIcon }
  ]
}

const dropdownItems: DropdownMap = {
  DBC: [
    { label: 'DBC Editor', icon: icons.dbcEditorIcon },
    { label: 'DBC Add', icon: icons.dbcEditorIcon }
  ]
}

const openDropdown = ref<string | null>(null)
const router = useRouter()
const showStartDialog = ref(false)
const isDialogMaximized = ref(false)
const isDialogMinimized = ref(false)
const canModels: CanModel[] = [
  { id: 'peak-usb', name: 'PEAK USB', channels: ['CAN 1', 'CAN 2'] },
  { id: 'vector-can', name: 'Vector CANcase', channels: ['CAN 1', 'CAN 2', 'CAN 3'] },
  { id: 'zlg-usbcan', name: 'ZLG USB-CAN', channels: ['CAN 1'] }
]
const selectedModelId = ref(canModels[0].id)
const selectedChannelByModel = ref<Record<string, string>>(
  Object.fromEntries(canModels.map((model) => [model.id, model.channels[0] ?? '']))
)
const selectedModel = computed(() => canModels.find((model) => model.id === selectedModelId.value))
const pageMap: Record<string, string> = {
  工具箱: '/Home',
  全仿真模式: '/Home',
  测量设置: '/Home',
  系统消息: '/Home',
  硬件配置: '/Home',
  设计工具: '/Home',
  仿真设置: '/Home',
  生成代码: '/Home',
  测试用例: '/Home',
  应用管理: '/Home',
  'DBC Editor': '/List',
  'DBC Add': '/Home'
}

const selectTab = (tab: string): void => {
  activeTab.value = tab
  openDropdown.value = null
}

const toggleDropdown = (label: string): void => {
  openDropdown.value = openDropdown.value === label ? null : label
}

const hasDropdown = (label: string): boolean => !!dropdownItems[label]

const handleToolClick = async (tool: ToolItem): Promise<void> => {
  if (tool.label === '启动') {
    showStartDialog.value = true
    isDialogMinimized.value = false
    openDropdown.value = null
    return
  }
  if (hasDropdown(tool.label)) {
    toggleDropdown(tool.label)
    return
  }
  openDropdown.value = null
  const path = pageMap[tool.label]
  if (!path) return
  await router.push(path)
}

const getMenuItems = (tool: ToolItem): ToolItem[] => dropdownItems[tool.label] ?? []

const handleMenuItemClick = async (item: ToolItem): Promise<void> => {
  openDropdown.value = null
  const path = pageMap[item.label]
  if (!path) return
  await router.push(path)
}

const closeStartDialog = (): void => {
  showStartDialog.value = false
  isDialogMaximized.value = false
  isDialogMinimized.value = false
}

const minimizeDialog = (): void => {
  isDialogMinimized.value = true
  isDialogMaximized.value = false
}

const toggleMaximizeDialog = (): void => {
  isDialogMinimized.value = false
  isDialogMaximized.value = !isDialogMaximized.value
}
</script>

<style scoped>
.ribbon-root {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  z-index: 1000;
  background: #fff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
}
.ribbon-header {
  display: flex;
  align-items: center;
  height: 48px;
  padding-left: 18px;
  background: #fff;
  border-bottom: 1px solid #e0e0e0;
}
.bms-logo {
  width: 36px;
  height: 36px;
  margin-right: 12px;
}
.bms-title {
  font-size: 22px;
  font-weight: bold;
  color: #1976d2;
  letter-spacing: 1px;
}
.ribbon-tabs {
  display: flex;
  align-items: center;
  justify-content: space-evenly;
  gap: 0;
  background: #fff;
  border-bottom: 1px solid #dcdcdc;
  padding: 2px 12px;
  margin: 0;
}
/* 一级标签栏 */
.ribbon-tab {
  background: none;
  border: none;
  font-family: 'Microsoft YaHei UI', 'PingFang SC', sans-serif;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.2;
  white-space: nowrap;
  flex: 1 1 0;
  text-align: center;
  padding: 6px 8px;
  cursor: pointer;
  color: #333;
  border-bottom: 2px solid transparent;
  transition:
    border 0.2s,
    color 0.2s;
}
.ribbon-tab.active {
  color: #1976d2;
  border-bottom: 2px solid #1976d2;
  background: #e3f2fd;
}
.ribbon-toolbar {
  display: flex;
  align-items: stretch;
  background: #fff;
  padding: 0 8px;
  border-bottom: 1px solid #e0e0e0;
  margin: 0;
  min-height: 66px;
}
.toolbar-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-right: 0;
  background: #fff;
  border: none;
  border-radius: 0;
  padding: 6px 10px;
  min-width: 88px;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.2s;
}
.toolbar-btn:hover {
  background: #f2f7ff;
}
.toolbar-icon {
  width: 22px;
  height: 22px;
  margin-right: 0;
  margin-bottom: 3px;
}
.dropdown {
  position: relative;
  border-right: 1px solid #ececec;
}
.dropdown-trigger {
  min-width: 100px;
  height: 100%;
  justify-content: center;
}
.toolbar-main {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
}
.toolbar-label {
  line-height: 1.2;
}
.dropdown-indicator {
  margin-top: 3px;
  width: 0;
  height: 0;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top: 5px solid #7a7a7a;
}
.dropdown-menu {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  min-width: 160px;
  background: #fff;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
  padding: 6px;
  z-index: 10;
}
.dropdown-item {
  width: 100%;
  display: flex;
  align-items: center;
  border: none;
  background: #fff;
  border-radius: 4px;
  padding: 8px 10px;
  cursor: pointer;
  font-size: 14px;
}
.dropdown-item:hover {
  background: #f5f9ff;
}
.small-icon {
  width: 18px;
  height: 18px;
  margin-bottom: 0;
  margin-right: 6px;
}

.dialog-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1200;
}

.start-dialog {
  width: min(980px, 90vw);
  min-width: 620px;
  min-height: 420px;
  max-height: 80vh;
  background: #fff;
  border: 1px solid #d9d9d9;
  box-shadow: 0 14px 28px rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  resize: both;
  overflow: auto;
}

.start-dialog.maximized {
  width: 96vw;
  height: 90vh;
  min-width: 96vw;
  min-height: 90vh;
  max-height: 90vh;
  resize: none;
}

.start-dialog.minimized {
  width: 360px;
  min-width: 360px;
  min-height: 0;
  height: auto;
  resize: none;
  overflow: hidden;
}

.start-dialog-header {
  height: 42px;
  padding: 0 14px;
  border-bottom: 1px solid #ececec;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  font-weight: 600;
}

.window-controls {
  display: flex;
  align-items: center;
  gap: 4px;
}

.window-btn {
  width: 36px;
  height: 28px;
  border: none;
  background: transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 4px;
}

.window-btn:hover {
  background: #f1f1f1;
}

.window-btn.close:hover {
  background: #e81123;
}

.window-btn.close:hover .icon-close::before,
.window-btn.close:hover .icon-close::after {
  background: #fff;
}

.icon-minimize,
.icon-maximize,
.icon-restore,
.icon-close {
  position: relative;
  width: 12px;
  height: 12px;
  display: inline-block;
}

.icon-minimize::before {
  content: '';
  position: absolute;
  left: 1px;
  right: 1px;
  bottom: 2px;
  height: 1.5px;
  background: #111;
}

.icon-maximize {
  border: 1.5px solid #111;
  border-radius: 1px;
}

.icon-restore::before,
.icon-restore::after {
  content: '';
  position: absolute;
  border: 1.5px solid #111;
  border-radius: 1px;
}

.icon-restore::before {
  width: 8px;
  height: 7px;
  top: 1px;
  right: 0;
  background: #fff;
}

.icon-restore::after {
  width: 8px;
  height: 7px;
  left: 0;
  bottom: 0;
}

.icon-close::before,
.icon-close::after {
  content: '';
  position: absolute;
  top: 5px;
  left: 0;
  width: 12px;
  height: 1.5px;
  background: #111;
}

.icon-close::before {
  transform: rotate(45deg);
}

.icon-close::after {
  transform: rotate(-45deg);
}

.start-dialog-content {
  display: flex;
  min-height: 360px;
}

.model-list {
  width: 240px;
  border-right: 1px solid #ececec;
  padding: 12px;
  background: #fafafa;
}

.list-title,
.panel-title,
.preview-title {
  font-size: 13px;
  color: #666;
  margin-bottom: 10px;
}

.model-item {
  width: 100%;
  text-align: left;
  background: #fff;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  padding: 8px 10px;
  margin-bottom: 8px;
  cursor: pointer;
}

.model-item.active {
  border-color: #1976d2;
  background: #eaf3ff;
}

.channel-panel {
  flex: 1;
  padding: 14px 16px;
}

.channel-row {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  gap: 10px;
}

.row-label {
  width: 72px;
  font-size: 13px;
  color: #555;
}

.row-value {
  font-size: 14px;
  color: #222;
}

.channel-select {
  min-width: 180px;
  height: 30px;
  border: 1px solid #d0d0d0;
  border-radius: 4px;
  padding: 0 8px;
}

.mapping-preview {
  margin-top: 20px;
  border: 1px solid #ececec;
  border-radius: 6px;
  padding: 10px;
}

.preview-item {
  display: flex;
  justify-content: space-between;
  border-top: 1px solid #f0f0f0;
  padding: 8px 0;
  font-size: 13px;
}

.preview-item:first-of-type {
  border-top: none;
}
</style>
