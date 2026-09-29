<template>
  <div class="p-6">
    <div class="w-2/3 flex flex-col gap-5">
      <!-- 左/右扳机切换 -->
      <div class="inline-flex rounded-lg overflow-hidden border border-gray-700 w-fit">
        <button
          v-for="t in TRIGGER_TABS"
          :key="t.key"
          class="px-6 py-2 text-sm font-medium transition-colors duration-150"
          :class="
            activeTrigger === t.key
              ? 'bg-blue-600 text-white'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          "
          @click="activeTrigger = t.key"
        >
          {{ t.label }}
        </button>
      </div>

      <!-- 行程范围卡片 -->
      <div class="rounded-2xl bg-gray-800/50 border border-gray-700 p-5">
        <h2 class="text-xl font-bold mb-4">行程范围</h2>
        <div class="flex items-center gap-3">
          <!-- 最小值 -->
          <div class="flex items-center rounded bg-gray-900 border border-gray-700 overflow-hidden">
            <input
              v-model.number="current.min"
              type="number"
              class="w-14 px-2 py-1.5 bg-transparent text-white text-sm text-center outline-none no-spinner"
              @change="clampField('min')"
            />
            <div class="flex flex-col border-l border-gray-700">
              <button
                class="px-1.5 py-0.5 text-[10px] leading-none text-gray-400 hover:text-white transition-colors duration-150"
                @click="stepValue('min', 1)"
              >
                ▲
              </button>
              <button
                class="px-1.5 py-0.5 text-[10px] leading-none text-gray-400 hover:text-white border-t border-gray-700 transition-colors duration-150"
                @click="stepValue('min', -1)"
              >
                ▼
              </button>
            </div>
          </div>

          <!-- 双滑块：中间蓝色为选中范围（自定义拖拽，两个把手互不影响） -->
          <div
            ref="trackRef"
            class="relative flex-1 h-6 cursor-pointer select-none"
            @mousedown="onTrackDown"
          >
            <div class="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-1.5 rounded bg-gray-600"></div>
            <div
              class="absolute top-1/2 -translate-y-1/2 h-1.5 bg-blue-600 rounded"
              :style="fillStyle"
            ></div>
            <div
              class="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white shadow cursor-grab"
              :style="{ left: current.min + '%' }"
            ></div>
            <div
              class="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white shadow cursor-grab"
              :style="{ left: current.max + '%' }"
            ></div>
          </div>

          <!-- 最大值 -->
          <div class="flex items-center rounded bg-gray-900 border border-gray-700 overflow-hidden">
            <input
              v-model.number="current.max"
              type="number"
              class="w-14 px-2 py-1.5 bg-transparent text-white text-sm text-center outline-none no-spinner"
              @change="clampField('max')"
            />
            <div class="flex flex-col border-l border-gray-700">
              <button
                class="px-1.5 py-0.5 text-[10px] leading-none text-gray-400 hover:text-white transition-colors duration-150"
                @click="stepValue('max', 1)"
              >
                ▲
              </button>
              <button
                class="px-1.5 py-0.5 text-[10px] leading-none text-gray-400 hover:text-white border-t border-gray-700 transition-colors duration-150"
                @click="stepValue('max', -1)"
              >
                ▼
              </button>
            </div>
          </div>
        </div>
        <p class="text-xs text-gray-500 mt-3">调整扳机的作用范围，数值越大按到底所需行程越长</p>
      </div>

      <!-- 扳机模式卡片 -->
      <div class="rounded-2xl bg-gray-800/50 border border-gray-700 p-5">
        <h2 class="text-xl font-bold mb-4">扳机模式</h2>
        <div class="flex gap-3">
          <button
            v-for="m in TRIGGER_MODES"
            :key="m.value"
            class="flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150"
            :class="
              current.mode === m.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            "
            @click="selectMode(m.value)"
          >
            {{ m.label }}
          </button>
        </div>
        <p class="text-xs text-gray-500 mt-3">调整扳机的输出模式，决定按下扳机的响应特性</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from "vue";
import { useHidDevice } from "../composables/useHidDevice";
import { useDeviceCommand } from "../composables/useDeviceCommand";

// 接收数据标准头：30 55 aa
const HEADER = [0x30, 0x55, 0xaa];

// 左/右扳机切换
const TRIGGER_TABS = [
  { key: "left", label: "左扳机" },
  { key: "right", label: "右扳机" },
];
// 扳机模式：长扳机 / 短扳机
const TRIGGER_MODES = [
  { value: "long", label: "长扳机" },
  { value: "short", label: "短扳机" },
];

const activeTrigger = ref("left");
// 左/右扳机各自独立保存：行程范围 min(前死区)/max(后死区) 0-100 + 模式
const triggerSettings = reactive({
  left: { min: 0, max: 99, mode: "long" },
  right: { min: 0, max: 99, mode: "long" },
});

const current = computed(() => triggerSettings[activeTrigger.value]);

const { connected, subscribeInputReport } = useHidDevice();
const { requestTriggerDeadzone, setTriggerDeadzone } = useDeviceCommand();

// 双滑块中间蓝色填充
const fillStyle = computed(() => ({
  left: `${current.value.min}%`,
  width: `${current.value.max - current.value.min}%`,
}));

// 下发当前扳机设置：前死区=min、后死区=max、模式 0 长 / 1 短
function sendTrigger() {
  const c = current.value;
  setTriggerDeadzone(
    activeTrigger.value === "right",
    c.min,
    c.max,
    c.mode === "short"
  );
}

// ===== 双滑块自定义拖拽 =====
// 两个把手独立：按下时选离得近的，拖动中钳制 0-100 且 min < max（不重叠）
const trackRef = ref(null);
let dragField = null; // 'min' | 'max'

function trackValueFromEvent(e) {
  const rect = trackRef.value.getBoundingClientRect();
  const x = e.clientX - rect.left;
  return Math.round((x / rect.width) * 100);
}

function onTrackDown(e) {
  const v = trackValueFromEvent(e);
  const c = current.value;
  // 离哪个把手近拖哪个（相等时拖左）
  dragField = Math.abs(v - c.min) <= Math.abs(v - c.max) ? "min" : "max";
  applyDrag(v);
  window.addEventListener("mousemove", onTrackMove);
  window.addEventListener("mouseup", onTrackUp);
  e.preventDefault();
}

function onTrackMove(e) {
  if (dragField) applyDrag(trackValueFromEvent(e));
}

function applyDrag(v) {
  const c = current.value;
  v = Math.min(100, Math.max(0, v));
  if (dragField === "min") {
    c.min = Math.min(v, c.max - 1); // 左把手不能越过右把手（保持至少差 1）
  } else {
    c.max = Math.max(v, c.min + 1);
  }
}

function onTrackUp() {
  dragField = null;
  window.removeEventListener("mousemove", onTrackMove);
  window.removeEventListener("mouseup", onTrackUp);
  sendTrigger(); // 释放后下发
}

// 步进调整（上下箭头）：调整后经钳制下发
function stepValue(field, dir) {
  const c = current.value;
  c[field] = (Number(c[field]) || 0) + dir;
  clampField(field);
}

// 钳制到合法范围：min 0-99 且小于 max；max 1-100 且大于 min；钳制后下发
function clampField(field) {
  const c = current.value;
  let v = Math.round(Number(c[field]));
  if (!Number.isFinite(v)) v = field === "min" ? 0 : 100;
  if (field === "min") {
    c.min = Math.min(99, Math.max(0, v));
    if (c.min >= c.max) c.min = c.max - 1;
  } else {
    c.max = Math.min(100, Math.max(1, v));
    if (c.max <= c.min) c.max = c.min + 1;
  }
  sendTrigger();
}

// 选择扳机模式后下发
function selectMode(m) {
  current.value.mode = m;
  sendTrigger();
}

// LT/RT 死区回复：0xD0 ID, 0x0A CMD, Device Mode,
// LT 前死区 / RT 前死区 / RT 后死区 / LT 后死区, LT 模式, RT 模式（0 长 / 1 短）
const unsubscribe = subscribeInputReport((data) => {
  if (data.length < 12) return;
  if (HEADER.some((b, i) => data[i] !== b)) return;
  if (data[3] !== 0xd0 || data[4] !== 0x0a) return;
  const left = {
    min: data[6],
    max: data[9],
    mode: data[10] === 1 ? "short" : "long",
  };
  const right = {
    min: data[7],
    max: data[8],
    mode: data[11] === 1 ? "short" : "long",
  };
  for (const s of [left, right]) {
    s.min = Math.min(99, Math.max(0, s.min));
    s.max = Math.min(100, Math.max(1, s.max));
    if (s.min >= s.max) s.min = s.max - 1;
  }
  triggerSettings.left = left;
  triggerSettings.right = right;
});

onMounted(() => {
  if (connected.value) requestTriggerDeadzone();
});

onUnmounted(() => {
  // 拖拽中切页时清理全局监听
  window.removeEventListener("mousemove", onTrackMove);
  window.removeEventListener("mouseup", onTrackUp);
  unsubscribe();
});
</script>

<style scoped>
/* 隐藏数字输入框的原生 spinner（用自定义上下箭头） */
.no-spinner::-webkit-outer-spin-button,
.no-spinner::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.no-spinner {
  -moz-appearance: textfield;
  appearance: textfield;
}
</style>
