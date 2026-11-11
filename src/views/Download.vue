<template>
  <div class="flex h-full">
    <!-- 左侧选择栏 -->
    <nav class="w-48 min-h-screen bg-gray-800 text-gray-100 flex flex-col">
      <div class="p-4 text-lg font-bold border-b border-gray-700 flex items-center justify-between">
        <button
          class="w-7 h-7 rounded-full bg-gray-700 text-gray-300 hover:text-white transition-colors duration-150 flex items-center justify-center"
          title="返回"
          @click="$emit('back')"
        >
          <svg
            class="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <span>下载</span>
      </div>
      <div class="flex-1 overflow-y-auto">
        <button
          v-for="item in items"
          :key="item.id"
          class="w-full text-left block px-4 py-3 text-sm hover:bg-gray-700 transition-colors"
          :class="
            active === item.id
              ? 'bg-gray-700 text-white border-l-2 border-blue-500'
              : 'border-l-2 border-transparent'
          "
          @click="active = item.id"
        >
          {{ item.id }}
        </button>
      </div>
    </nav>

    <!-- 右侧内容区 -->
    <main class="flex-1 overflow-y-auto p-6">
      <div v-if="current" class="max-w-2xl">
        <!-- 有下载文件 -->
        <div v-if="current.files.length" class="rounded-2xl border border-gray-700/60 bg-gray-800/40 p-6">
          <h2 class="text-xl font-bold text-white">{{ current.name || current.id }}</h2>

          <!-- 文件列表：每个文件一行（文件名 + 描述 + 大小 + 下载按钮） -->
          <div
            v-for="f in current.files"
            :key="f.file"
            class="mt-5 first:mt-5 flex items-center gap-4 border-t border-gray-700/60 pt-5"
          >
            <div class="flex-1 min-w-0">
              <div class="text-white font-semibold truncate">{{ f.file }}</div>
              <div v-if="f.desc" class="mt-1 text-xs text-gray-400">{{ f.desc }}</div>
              <div class="mt-1 text-xs text-gray-500">{{ f.size }}</div>
            </div>
            <a
              :href="f.url"
              download
              class="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors duration-150"
            >
              <svg
                class="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              下载
            </a>
          </div>
        </div>

        <!-- 无下载文件 -->
        <div v-else class="rounded-2xl border border-gray-700/60 bg-gray-800/40 p-6 text-gray-400 text-sm">
          暂无下载内容
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";

defineEmits(["back"]);

const items = [
  {
    id: "国华",
    name: "GHIC 升级工具",
    files: [
      {
        file: "20260928_KKL2_954_A0.exe",
        desc: "954升级工具",
        size: "6.1 MB",
        url: "https://github.com/hankielao/ghic/releases/download/1.0/20260928_KKL2_954_A0.exe",
      },
      {
        file: "20261021-KKL926-A0.exe",
        desc: "926升级工具",
        size: "5.97 MB",
        url: "https://github.com/hankielao/ghic/releases/download/1.0/20261021-KKL926-A0.exe",
      },
    ],
  },
  { id: "翊卓", name: "", files: [] },
  { id: "其他", name: "", files: [] },
];
const active = ref("001");
const current = computed(() => items.find((i) => i.id === active.value));
</script>
