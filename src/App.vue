<template>
  <div class="h-screen bg-gray-900 text-gray-100">
    <!-- 未连接：全屏连接页面 -->
    <div
      v-if="!connected"
      class="flex flex-col items-center justify-center h-full gap-4"
    >
      <div class="bg-gray-800 rounded-lg p-8 w-full max-w-md">
        <h1 class="text-2xl font-bold text-center mb-6">WebHID 手柄调试工具</h1>
        <div class="mb-4">
          <label class="block text-sm text-gray-400 mb-1">VID(十六进制)</label>
          <input
            v-model="vidHex"
            class="w-full bg-gray-700 px-3 py-2 rounded"
            placeholder="413d"
          />
        </div>
        <div class="mb-6">
          <label class="block text-sm text-gray-400 mb-1">PID(十六进制)</label>
          <input
            v-model="pidHex"
            class="w-full bg-gray-700 px-3 py-2 rounded"
            placeholder="2104"
          />
        </div>
        <button
          @click="openDevice"
          class="w-full bg-green-600 hover:bg-green-700 px-4 py-2 rounded font-medium"
        >
          选择连接设备
        </button>
      </div>
      <div
        class="text-xs text-gray-400 text-center leading-relaxed bg-gray-800 rounded-lg px-4 py-3 whitespace-nowrap"
      >
        请使用系统自带浏览器，谷歌浏览器，QQ浏览器等，暂不支持Mac系统，请不要使用QQ微信自带的浏览器打开
      </div>
    </div>

    <!-- 已连接：侧边栏 + 内容区 -->
    <div v-else class="flex h-full">
      <SideMenu />
      <main class="flex-1 overflow-y-auto">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import SideMenu from "./components/SideMenu.vue";
import { useHidDevice } from "./composables/useHidDevice";

const { connected, vidHex, pidHex, openDevice } = useHidDevice();
</script>
