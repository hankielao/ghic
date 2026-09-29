<template>
  <div class="p-6">
    <div class="flex gap-6 items-start flex-wrap">
    <!-- 按钮分组，每组一行，宽度为屏幕一半 -->
    <div class="flex flex-col gap-3 w-1/2 min-w-[320px] p-4 rounded-2xl bg-gray-800/50 border border-gray-700">
      <!-- ABXY -->
      <div class="flex gap-3">
        <div
          v-for="name in ['A', 'B', 'X', 'Y']"
          :key="name"
          class="flex-1 select-none cursor-default px-5 py-3 rounded-lg text-center font-bold text-white transition-colors duration-150"
          :class="btnState(name) ? 'bg-green-600' : 'bg-gray-600'"
        >
          {{ name }}
        </div>
      </div>
      <!-- 上下左右 -->
      <div class="flex gap-3">
        <div
          v-for="name in ['上', '下', '左', '右']"
          :key="name"
          class="flex-1 select-none cursor-default px-5 py-3 rounded-lg text-center font-bold text-white transition-colors duration-150"
          :class="btnState(name) ? 'bg-green-600' : 'bg-gray-600'"
        >
          {{ name }}
        </div>
      </div>
      <!-- L1 R1 L3 R3 -->
      <div class="flex gap-3">
        <div
          v-for="name in ['L1', 'R1', 'L3', 'R3']"
          :key="name"
          class="flex-1 select-none cursor-default px-5 py-3 rounded-lg text-center font-bold text-white transition-colors duration-150"
          :class="btnState(name) ? 'bg-green-600' : 'bg-gray-600'"
        >
          {{ name }}
        </div>
      </div>
      <!-- L2 / R2 模拟量 -->
      <div class="flex gap-6 mt-2">
        <div v-for="t in triggers" :key="t.name" class="flex-1">
          <div
            class="px-5 py-3 rounded-lg text-center font-bold text-white mb-2"
            :style="{ backgroundColor: triggerColor(t.value) }"
          >
            {{ t.name }} ({{ t.value }})
          </div>
          <div class="h-3 bg-gray-700 rounded overflow-hidden">
            <div
              class="h-full transition-all duration-100"
              :style="{
                width: `${(t.value / 255) * 100}%`,
                backgroundColor: triggerColor(t.value),
              }"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 摇杆圆环 -->
    <div class="flex-1 min-w-[480px] flex gap-6 justify-center p-4 rounded-2xl bg-gray-800/50 border border-gray-700">
      <div v-for="s in sticks" :key="s.name" class="flex flex-col items-center gap-2">
        <div class="px-4 py-2 bg-gray-800/70 rounded-lg text-sm font-mono text-gray-200 min-w-[200px] text-center">
          {{ s.nx.toFixed(5) }}, {{ s.ny.toFixed(5) }}
        </div>
        <svg viewBox="0 0 200 200" class="w-[200px] h-[200px]">
          <!-- 外圆 -->
          <circle cx="100" cy="100" r="90" fill="none" stroke="#6b7280" stroke-width="1.5" />
          <!-- 十字线 -->
          <line x1="10" y1="100" x2="190" y2="100" stroke="#4b5563" stroke-width="1.5" />
          
          <line x1="100" y1="10" x2="100" y2="190" stroke="#4b5563" stroke-width="1.5" />
          <!-- 中心点到坐标点虚线 -->
          <line
            x1="100" y1="100"
            :x2="stickPoint(s).x" :y2="stickPoint(s).y"
            stroke="#60a5fa" stroke-width="1.5"
            stroke-dasharray="5 4"
          />
          <!-- 坐标点 -->
          <circle
            :cx="stickPoint(s).x" :cy="stickPoint(s).y"
            r="7" fill="#3b82f6" stroke="#ffffff" stroke-width="2"
          />
          <!-- 中心点 -->
          <circle cx="100" cy="100" r="4" fill="#ef4444" />
        </svg>
      </div>
    </div>
    </div>

    <p class="text-xs text-gray-500 mt-6">
      按钮按下时变绿，松开恢复灰色。L2/R2 值越高颜色越深。
    </p>
  </div>
</template>

<script setup>
import { ref, onUnmounted } from "vue";
import { useHidDevice } from "../composables/useHidDevice";

// 接收数据标准头：30 55 aa，剩余为 payload
// payload[0]=0xD4, payload[1]=CMD, payload[2]=Key1, payload[3]=Key2, payload[4]=Key3
// Key1: bit7=Y bit6=X bit5=B bit4=A bit3=Left bit2=Down bit1=Right bit0=Up
// Key2: bit5=R3 bit4=L3 bit3=START bit2=BACK bit1=R1 bit0=L1
// L2/R2 为模拟量：data[9]=L2, data[10]=R2 (0~0xff)
const HEADER = [0x30, 0x55, 0xaa];

const buttonMap = {
  A:      { byte: 2, bit: 4 },
  B:      { byte: 2, bit: 5 },
  X:      { byte: 2, bit: 6 },
  Y:      { byte: 2, bit: 7 },
  上:     { byte: 2, bit: 0 },
  下:     { byte: 2, bit: 2 },
  左:     { byte: 2, bit: 3 },
  右:     { byte: 2, bit: 1 },
  L1:     { byte: 3, bit: 0 },
  R1:     { byte: 3, bit: 1 },
  L3:     { byte: 3, bit: 4 },
  R3:     { byte: 3, bit: 5 },
};

const btnStates = ref(
  Object.keys(buttonMap).reduce((acc, name) => {
    acc[name] = false;
    return acc;
  }, {})
);

function btnState(name) {
  return btnStates.value[name];
}

// L2/R2 模拟量
const triggers = ref([
  { name: "L2", byte: 12, value: 0 },
  { name: "R2", byte: 13, value: 0 },
]);

// 摇杆：圆环1 X=data[8] Y=data[9]，圆环2 X=data[10] Y=data[11]
// 原始值 0~255，中心 128，归一化到 -1~1：左/上为负，右/下为正
const sticks = ref([
  { name: "圆环1", xByte: 8, yByte: 9, nx: 0, ny: 0 },
  { name: "圆环2", xByte: 10, yByte: 11, nx: 0, ny: 0 },
]);

const STICK_CENTER = 100;
const STICK_RADIUS = 90;

function toAxis(v) {
  const n = (v - 127.5) / 127.5;
  return Math.max(-1, Math.min(1, n));
}

function stickPoint(s) {
  return {
    x: STICK_CENTER + s.nx * STICK_RADIUS,
    y: STICK_CENTER + s.ny * STICK_RADIUS,
  };
}

// 值越高绿色越深：0=gray-600, 255=green-900
function triggerColor(v) {
  if (v <= 0) return "rgb(75, 85, 99)"; // gray-600
  const t = Math.min(v, 255) / 255;
  const r = Math.round(134 - (134 - 20) * t);
  const g = Math.round(239 - (239 - 83) * t);
  const b = Math.round(172 - (172 - 45) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

const { subscribeInputReport } = useHidDevice();

const unsubscribe = subscribeInputReport((data) => {
  // 校验头：30 55 aa
  if (
    data.length < HEADER.length ||
    HEADER.some((b, i) => data[i] !== b)
  ) {
    return;
  }
  const payload = data.subarray(HEADER.length);
  // 校验 ID 字节：0xD4 测试模式数据
  if (payload.length < 3 || payload[0] !== 0xd4) return;
  Object.keys(buttonMap).forEach((name) => {
    const map = buttonMap[name];
    if (map.byte < payload.length) {
      btnStates.value[name] = (payload[map.byte] & (1 << map.bit)) !== 0;
    }
  });
  triggers.value.forEach((t) => {
    if (t.byte < data.length) {
      t.value = data[t.byte];
    }
  });
  sticks.value.forEach((s) => {
    if (s.xByte < data.length && s.yByte < data.length) {
      s.nx = toAxis(data[s.xByte]);
      s.ny = toAxis(data[s.yByte]);
    }
  });
});

onUnmounted(() => {
  unsubscribe();
});
</script>
