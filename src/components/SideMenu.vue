<template>
  <nav class="w-48 min-h-screen bg-gray-800 text-gray-100 flex flex-col">
    <div class="p-4 text-lg font-bold border-b border-gray-700">
      WebHID Tool
    </div>
    <div class="flex-1 overflow-y-auto">
      <router-link
        v-for="item in menuItems"
        :key="item.path"
        :to="item.path"
        class="block px-4 py-3 text-sm hover:bg-gray-700 transition-colors"
        active-class="bg-gray-700 text-white border-l-2 border-blue-500"
      >
        {{ item.label }}
      </router-link>
    </div>
  </nav>
</template>

<script setup>
const menuItems = [
  { path: "/", label: "首页" },
  { path: "/joystick", label: "摇杆" },
  { path: "/button", label: "按键" },
  { path: "/vibration", label: "震动" },
  { path: "/trigger", label: "扳机" },
  { path: "/calibrate", label: "校准" },
  { path: "/test", label: "测试" },
];
</script>