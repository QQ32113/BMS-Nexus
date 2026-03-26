<template>
  <div class="ribbon-root">
    <!-- 一级标签栏 -->
    <div class="ribbon-tabs">
      <button
        v-for="tab in tabs"
        :key="tab"
        :class="['ribbon-tab', { active: tab === activeTab }]"
        @click="activeTab = tab"
      >
        {{ tab }}
      </button>
    </div>
    <!-- 二级工具栏 -->
    <div class="ribbon-toolbar">
      <template v-for="tool in toolbars[activeTab]" :key="tool.label">
        <button class="toolbar-btn">
          <img v-if="tool.icon" :src="tool.icon" class="toolbar-icon" />
          {{ tool.label }}
        </button>
      </template>
    </div>
    <!-- 你的主内容区，可扩展 -->
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
const tabs = ['分析', '硬件', '设计', '仿真', '代码生成', '测试', '应用', '工具']
const activeTab = ref(tabs[0])
const toolbars = {
  分析: [
    { label: '实时模式', icon: '' },
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
    { label: '工具箱', icon: '' },
    { label: 'DataBase', icon: '' }
  ]
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
  background: #fff;
  border-bottom: 1px solid #dcdcdc;
  padding: 4px 0 4px 0;
  margin: 0;
}
.ribbon-tab {
  background: none;
  border: none;
  font-size: 16px;
  padding: 8px 24px;
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
  background: #fff;
  padding: 8px 0 8px 8px;
  border-bottom: 1px solid #e0e0e0;
  margin: 0;
}
.toolbar-btn {
  display: flex;
  align-items: center;
  margin-right: 18px;
  background: #f0f0f0;
  border: none;
  border-radius: 4px;
  padding: 6px 16px;
  font-size: 15px;
  cursor: pointer;
  transition: background 0.2s;
}
.toolbar-btn:hover {
  background: #e6f7ff;
}
.toolbar-icon {
  width: 20px;
  height: 20px;
  margin-right: 6px;
}
</style>
