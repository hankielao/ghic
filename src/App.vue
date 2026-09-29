<template>
  <div class="h-screen bg-gray-900 text-gray-100">
    <!-- 未连接：全屏连接页面 -->
    <div
      v-if="!connected"
      class="flex flex-col items-center justify-center h-full gap-4"
    >
      <div class="bg-gray-800 rounded-2xl p-10 w-full max-w-md text-center">
        <h1 class="text-2xl font-bold text-white">请连接设备</h1>
        <p class="mt-3 text-sm text-gray-400">请用USB有线连接手柄后点击连接</p>
        <button
          @click="openDevice"
          class="mt-8 w-full bg-blue-600 hover:bg-blue-500 px-4 py-2.5 rounded-lg font-medium text-white"
        >
          连接设备
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

const { connected, openDevice } = useHidDevice();
</script>
