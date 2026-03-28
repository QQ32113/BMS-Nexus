<template>
  <div class="app-shell">
    <Ribbon />
    <main class="app-main" aria-label="工作区">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<script setup lang="ts">
import Ribbon from './Views/Ribbon.vue'
</script>

<style scoped>
.app-shell {
  --app-ribbon-height: 108px;

  min-height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  background: var(--app-workspace-bg, #f3f2f1);
}

.app-main {
  flex: 1;
  min-height: 0;
  margin-top: var(--app-ribbon-height);
  padding: 12px 16px 16px;
  overflow: auto;
  color: var(--app-text, #201f1e);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.12s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
