<template>
  <div class="p-6">
  
    <div class="flex gap-2">
      <button
        v-for="tab in tabs"
        :key="tab"
        class="px-5 py-2 rounded-lg font-medium text-white transition-colors duration-150"
        :class="activeTab === tab ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'"
        @click="switchTab(tab)"
      >
        {{ tab }}
      </button>
    </div>

    <div class="mt-5 grid grid-cols-2 gap-5">
      <!-- 左列 -->
      <div class="flex flex-col gap-12">
        <!-- 预设曲线 -->
        <div class="rounded-2xl bg-gray-800/50 border border-gray-700 p-5">
          <h2 class="text-xl font-bold mb-2">预设曲线</h2>
          <p class="text-sm text-gray-400 mb-3">调整摇杆的输出曲线</p>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="p in presets"
              :key="p"
              :disabled="p === '自定义' && activePreset !== '自定义'"
              class="px-5 py-2 rounded-lg font-medium transition-colors duration-150"
              :class="
                activePreset === p
                  ? 'bg-blue-600 text-white'
                  : p === '自定义' && activePreset !== '自定义'
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-700 text-white hover:bg-gray-600'
              "
              @click="selectPreset(p)"
            >
              {{ p }}
            </button>
          </div>
        </div>

        <!-- 自定义设置 -->
        <div class="flex-1 rounded-2xl bg-gray-800/50 border border-gray-700 p-5">
          <h2 class="text-xl font-bold mb-2">自定义设置</h2>
          <p class="text-sm text-gray-400 mb-4">
            注意后一个点的输入跟输出值必须大于前一个点，以做约束；如果值不合理会自动调整
          </p>
          <div class="grid grid-cols-2 gap-x-6 gap-y-8">
            <div v-for="(p, i) in points" :key="i" class="flex items-center gap-2">
              <span class="text-sm text-gray-400 w-6">P{{ i + 1 }}</span>
              <label class="text-sm text-gray-400">输入</label>
              <input
                v-model.number="p.in"
                type="number"
                min="0"
                max="100"
                :disabled="i === points.length - 1"
                class="w-16 px-2 py-1 rounded bg-gray-900 border border-gray-600 text-white text-sm disabled:text-gray-500 disabled:cursor-not-allowed"
                @change="onPointChange(i, 'in')"
              />
              <label class="text-sm text-gray-400">输出</label>
              <input
                v-model.number="p.out"
                type="number"
                min="0"
                max="100"
                class="w-16 px-2 py-1 rounded bg-gray-900 border border-gray-600 text-white text-sm"
                @change="onPointChange(i, 'out')"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 右列：曲线图 -->
      <div class="rounded-2xl bg-gray-800/50 border border-gray-700 p-5">
        <h2 class="text-xl font-bold mb-2">曲线图</h2>
        <p class="text-sm text-gray-400 mb-3">调整摇杆的输出曲线</p>
        <svg
          ref="chartSvg"
          viewBox="0 0 620 500"
          class="w-full touch-none"
          @pointermove="onDragMove"
          @pointerup="onDragEnd"
          @pointercancel="onDragEnd"
        >
          <!-- 网格 -->
          <g v-for="t in ticks" :key="'grid' + t">
            <line
              :x1="xPos(t)"
              :y1="CHART.top"
              :x2="xPos(t)"
              :y2="CHART.bottom"
              stroke="#374151"
              stroke-width="1"
            />
            <line
              :x1="CHART.left"
              :y1="yPos(t)"
              :x2="CHART.right"
              :y2="yPos(t)"
              stroke="#374151"
              stroke-width="1"
            />
          </g>
          <!-- 刻度标签 -->
          <g v-for="t in ticks" :key="'label' + t">
            <text
              :x="CHART.left - 10"
              :y="yPos(t) + 4"
              text-anchor="end"
              fill="#9ca3af"
              font-size="12"
            >
              {{ t }}
            </text>
            <text
              :x="xPos(t)"
              :y="CHART.bottom + 18"
              text-anchor="middle"
              fill="#9ca3af"
              font-size="12"
            >
              {{ t }}
            </text>
          </g>
          <!-- 参考对角线（输入=输出） -->
          <line
            :x1="xPos(0)"
            :y1="yPos(0)"
            :x2="xPos(100)"
            :y2="yPos(100)"
            stroke="#6b7280"
            stroke-width="1"
            stroke-dasharray="6 5"
          />
          <!-- 曲线 -->
          <polyline :points="polyline" fill="none" stroke="#3b82f6" stroke-width="2" />
          <g
            v-for="(p, i) in chartPoints"
            :key="i"
            class="cursor-grab"
            @pointerdown="onDragStart(i, $event)"
          >
            <!-- 透明扩大可拖动范围 -->
            <circle :cx="p.x" :cy="p.y" r="10" fill="transparent" />
            <circle
              :cx="p.x"
              :cy="p.y"
              r="4.5"
              fill="#3b82f6"
              stroke="#bfdbfe"
              stroke-width="1.5"
            />
          </g>
        </svg>
      </div>
    </div>

    <!-- 死区设置 -->
    <div class="mt-5 rounded-2xl bg-gray-800/50 border border-gray-700 p-5">
      <h2 class="text-xl font-bold mb-2">死区设置</h2>
      <p class="text-sm text-gray-400 mb-4">调整摇杆的死区范围</p>
      <div class="grid grid-cols-2 gap-5">
        <div class="rounded-xl bg-gray-900/40 border border-gray-700 p-4">
          <h3 class="font-semibold mb-4">中心死区</h3>
          <div class="flex items-center gap-3">
            <input
              v-model.number="centerDeadzone"
              type="range"
              min="0"
              max="100"
              class="flex-1 accent-blue-600 cursor-pointer"
              @change="commitDeadzone"
            />
            <input
              v-model.number="centerDeadzone"
              type="number"
              min="0"
              max="100"
              class="w-20 px-2 py-1 rounded bg-gray-900 border border-gray-600 text-white text-sm"
              @change="commitDeadzone"
            />
            <span class="text-sm text-gray-400 whitespace-nowrap">范围 0-100</span>
          </div>
          <p class="mt-3 text-sm text-gray-400">
            摇杆中心没有反应的区域，数值越小摇杆越快有反应
          </p>
        </div>
        <div class="rounded-xl bg-gray-900/40 border border-gray-700 p-4">
          <h3 class="font-semibold mb-4">外围死区</h3>
          <div class="flex items-center gap-3">
            <input
              v-model.number="outerDeadzone"
              type="range"
              min="0"
              max="100"
              class="flex-1 accent-blue-600 cursor-pointer"
              @change="commitDeadzone"
            />
            <input
              v-model.number="outerDeadzone"
              type="number"
              min="0"
              max="100"
              class="w-20 px-2 py-1 rounded bg-gray-900 border border-gray-600 text-white text-sm"
              @change="commitDeadzone"
            />
            <span class="text-sm text-gray-400 whitespace-nowrap">范围 0-100</span>
          </div>
          <p class="mt-3 text-sm text-gray-400">
            调整摇杆的外圈死区，数值越大，摇杆越快达到最大值
          </p>
        </div>
      </div>
    </div>

    <!-- 轴反转设置 -->
    <div class="mt-5 rounded-2xl bg-gray-800/50 border border-gray-700 p-5">
      <h2 class="text-xl font-bold mb-2">轴反转设置</h2>
      <p class="text-sm text-gray-400 mb-4">调整摇杆 X / Y 轴方向反转</p>
      <div class="grid grid-cols-2 gap-5">
        <div class="rounded-xl bg-gray-900/40 border border-gray-700 p-4">
          <h3 class="font-semibold mb-4">X轴反转</h3>
          <div class="inline-flex rounded-lg overflow-hidden border border-gray-600">
            <button
              v-for="opt in invertOptions"
              :key="'x' + opt.value"
              class="px-5 py-1.5 text-sm font-medium transition-colors duration-150"
              :class="
                invertX === opt.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              "
              @click="onInvertClick('x', opt.value)"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>
        <div class="rounded-xl bg-gray-900/40 border border-gray-700 p-4">
          <h3 class="font-semibold mb-4">Y轴反转</h3>
          <div class="inline-flex rounded-lg overflow-hidden border border-gray-600">
            <button
              v-for="opt in invertOptions"
              :key="'y' + opt.value"
              class="px-5 py-1.5 text-sm font-medium transition-colors duration-150"
              :class="
                invertY === opt.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              "
              @click="onInvertClick('y', opt.value)"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useDeviceCommand } from "../composables/useDeviceCommand";
import { useHidDevice } from "../composables/useHidDevice";

const tabs = ["左摇杆", "右摇杆"];
const activeTab = ref(tabs[0]);

const {
  requestJoystickSensitivity,
  sendJoystickSensitivity,
  requestDeadzone,
  setDeadzone,
  requestInvert,
  setInvert,
} = useDeviceCommand();
const { subscribeInputReport } = useHidDevice();

const presets = ["默认", "即时", "均衡", "延迟", "高性能", "迅速平滑", "自定义"];
const activePreset = ref(presets[0]);

// 各预设曲线对应的 8 个点（暂未配置数据的预设仅切换选中态）
const PRESET_POINTS = {
  默认: [
    { in: 0, out: 0 },
    { in: 14, out: 14 },
    { in: 28, out: 28 },
    { in: 42, out: 42 },
    { in: 57, out: 57 },
    { in: 71, out: 71 },
    { in: 85, out: 85 },
    { in: 100, out: 100 },
  ],
  即时: [
    { in: 0, out: 0 },
    { in: 12, out: 12 },
    { in: 25, out: 25 },
    { in: 26, out: 42 },
    { in: 40, out: 53 },
    { in: 62, out: 70 },
    { in: 81, out: 85 },
    { in: 100, out: 100 },
  ],
  均衡: [
    { in: 0, out: 0 },
    { in: 12, out: 12 },
    { in: 24, out: 24 },
    { in: 54, out: 54 },
    { in: 70, out: 56 },
    { in: 86, out: 58 },
    { in: 93, out: 79 },
    { in: 100, out: 100 },
  ],
  延迟: [
    { in: 0, out: 0 },
    { in: 12, out: 12 },
    { in: 24, out: 24 },
    { in: 44, out: 35 },
    { in: 63, out: 45 },
    { in: 86, out: 58 },
    { in: 93, out: 79 },
    { in: 100, out: 100 },
  ],
  高性能: [
    { in: 0, out: 0 },
    { in: 12, out: 12 },
    { in: 24, out: 24 },
    { in: 36, out: 46 },
    { in: 54, out: 80 },
    { in: 70, out: 87 },
    { in: 84, out: 93 },
    { in: 100, out: 100 },
  ],
  迅速平滑: [
    { in: 0, out: 0 },
    { in: 2, out: 14 },
    { in: 5, out: 22 },
    { in: 10, out: 32 },
    { in: 20, out: 45 },
    { in: 35, out: 59 },
    { in: 60, out: 77 },
    { in: 100, out: 100 },
  ],
};

const points = ref(PRESET_POINTS["默认"].map((p) => ({ ...p })));

// 上一次有效的点位数据，用于值超出上限时回退
let lastValidPoints = points.value.map((p) => ({ ...p }));

function restorePoints() {
  points.value = lastValidPoints.map((p) => ({ ...p }));
}

function selectPreset(name) {
  activePreset.value = name;
  const data = PRESET_POINTS[name];
  if (data) {
    points.value = data.map((p) => ({ ...p }));
    lastValidPoints = points.value.map((p) => ({ ...p }));
    // 选中预设后按协议下发该曲线的 8 个点
    sendJoystickSensitivity(activeTab.value === "右摇杆", points.value);
  }
}

// ===== 从设备读取摇杆灵敏度 =====
// 接收数据标准头：30 55 aa；回复 ID = 0xD0，CMD = 0x86
const HEADER = [0x30, 0x55, 0xaa];
const JOYSTICK_REPLY_ID = 0xd0;
const JOYSTICK_REPLY_CMD = 0x86;
const REPLY_LENGTH = 20;

// 与预设曲线对比：完全一致则选中该预设，否则为自定义
function matchPreset(pts) {
  const hit = Object.keys(PRESET_POINTS).find((name) =>
    PRESET_POINTS[name].every((p, i) => p.in === pts[i].in && p.out === pts[i].out)
  );
  return hit || "自定义";
}

function switchTab(tab) {
  activeTab.value = tab;
  requestJoystickSensitivity(tab === "右摇杆");
}

// ===== 摇杆死区 =====
// payload[3] 左摇杆中心, [4] 右摇杆中心, [5] 左摇杆外死区, [6] 右摇杆外死区（均 0-100）
const DEADZONE_REPLY_CMD = 0x09;
const deadzone = ref({ ltCenter: 0, rtCenter: 0, ltOuter: 0, rtOuter: 0 });
let lastValidDeadzone = { ...deadzone.value };

// 当前页签对应的摇杆：左摇杆 → lt，右摇杆 → rt
function stickKey() {
  return activeTab.value === "右摇杆" ? "rt" : "lt";
}

const centerDeadzone = computed({
  get: () => deadzone.value[`${stickKey()}Center`],
  set: (v) => {
    deadzone.value[`${stickKey()}Center`] = v;
  },
});

const outerDeadzone = computed({
  get: () => deadzone.value[`${stickKey()}Outer`],
  set: (v) => {
    deadzone.value[`${stickKey()}Outer`] = v;
  },
});

// 滑块松手 / 数字框改动后：值非法或超出 0-100 则回退，否则按协议下发全部四个值
function commitDeadzone() {
  const k = stickKey();
  const center = deadzone.value[`${k}Center`];
  const outer = deadzone.value[`${k}Outer`];
  const valid = (v) => Number.isFinite(v) && v >= 0 && v <= 100;

  if (!valid(center) || !valid(outer)) {
    deadzone.value = { ...lastValidDeadzone };
    return;
  }

  lastValidDeadzone = { ...deadzone.value };
  setDeadzone(
    deadzone.value.ltCenter,
    deadzone.value.rtCenter,
    deadzone.value.ltOuter,
    deadzone.value.rtOuter
  );
}

// ===== 摇杆 XY 轴反转 =====
// payload[3] 左摇杆 X, [4] 左摇杆 Y, [5] 右摇杆 X, [6] 右摇杆 Y（0x00 不反转 / 0x01 反转）
const INVERT_REPLY_CMD = 0x07;
const invertOptions = [
  { label: "开启", value: 1 },
  { label: "关闭", value: 0 },
];
const invert = ref({ ltX: 0, ltY: 0, rtX: 0, rtY: 0 });

const invertX = computed({
  get: () => invert.value[`${stickKey()}X`],
  set: (v) => {
    invert.value[`${stickKey()}X`] = v;
  },
});

const invertY = computed({
  get: () => invert.value[`${stickKey()}Y`],
  set: (v) => {
    invert.value[`${stickKey()}Y`] = v;
  },
});

// 切换开启/关闭后按协议下发当前摇杆的 X / Y 反转
function onInvertClick(axis, value) {
  if (axis === "x") invertX.value = value;
  else invertY.value = value;
  setInvert(activeTab.value === "右摇杆", invertX.value, invertY.value);
}

const unsubscribe = subscribeInputReport((data) => {
  if (data.length < HEADER.length + 9) return;
  if (HEADER.some((b, i) => data[i] !== b)) return;

  const payload = data.subarray(HEADER.length);

  // 摇杆死区回复：0xD0 / 0x09
  if (payload[0] === JOYSTICK_REPLY_ID && payload[1] === DEADZONE_REPLY_CMD) {
    deadzone.value = {
      ltCenter: payload[3],
      rtCenter: payload[4],
      ltOuter: payload[5],
      rtOuter: payload[6],
    };
    lastValidDeadzone = { ...deadzone.value };
    // 读取死区后，接着读取 XY 轴反转
    requestInvert();
    return;
  }

  // 摇杆 XY 轴反转回复：0xD0 / 0x07
  if (payload[0] === JOYSTICK_REPLY_ID && payload[1] === INVERT_REPLY_CMD) {
    invert.value = {
      ltX: payload[3],
      ltY: payload[4],
      rtX: payload[5],
      rtY: payload[6],
    };
    return;
  }

  if (data.length < HEADER.length + REPLY_LENGTH) return;
  if (payload[0] !== JOYSTICK_REPLY_ID || payload[1] !== JOYSTICK_REPLY_CMD) return;

  // 标志位：0x00 左摇杆，0x01 右摇杆；与当前页签不符的数据忽略
  if ((payload[3] === 0x01) !== (activeTab.value === "右摇杆")) return;

  // payload[4..19]：8 个点，每点先 X 后 Y，取值范围 0-100
  const next = [];
  for (let i = 0; i < 8; i++) {
    next.push({ in: payload[4 + i * 2], out: payload[5 + i * 2] });
  }
  points.value = next;
  lastValidPoints = next.map((p) => ({ ...p }));
  activePreset.value = matchPreset(next);

  // 读取曲线数据后，接着读取摇杆死区
  requestDeadzone();
});

onMounted(() => requestJoystickSensitivity(false));
onUnmounted(() => unsubscribe());

// 手动修改点位时：预设曲线切到「自定义」，并保证每个点的输入/输出都大于前一个点
function onPointChange(index, field) {
  // 值非法或超过上限 100 时不接受改动，恢复原来的值
  if (!Number.isFinite(points.value[index][field]) || points.value[index][field] > 100) {
    restorePoints();
    return;
  }

  activePreset.value = "自定义";

  for (let i = Math.max(index, 1); i < points.value.length; i++) {
    const prev = points.value[i - 1];
    const cur = points.value[i];
    if (!Number.isFinite(cur.in) || !Number.isFinite(cur.out)) break;
    if (cur.in <= prev.in) cur.in = prev.in + 1;
    if (cur.out <= prev.out) cur.out = prev.out + 1;
  }

  // 自动调整后仍有值超出上限，整体回退
  if (points.value.some((p) => p.in > 100 || p.out > 100)) {
    restorePoints();
    return;
  }

  lastValidPoints = points.value.map((p) => ({ ...p }));
}

// 曲线图绘图区域
const CHART = { left: 50, right: 600, top: 20, bottom: 450 };
const ticks = Array.from({ length: 11 }, (_, i) => i * 10);

const xPos = (v) => CHART.left + (v / 100) * (CHART.right - CHART.left);
const yPos = (v) => CHART.bottom - (v / 100) * (CHART.bottom - CHART.top);

const chartPoints = computed(() =>
  points.value.map((p) => ({ x: xPos(p.in), y: yPos(p.out) }))
);
const polyline = computed(() =>
  chartPoints.value.map((p) => `${p.x},${p.y}`).join(" ")
);

// ===== 曲线图点位拖动 =====
const chartSvg = ref(null);
let dragIndex = null;

const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

function onDragStart(index, evt) {
  dragIndex = index;
  evt.currentTarget.setPointerCapture?.(evt.pointerId);
  evt.preventDefault();
}

function onDragEnd() {
  if (dragIndex === null) return;
  dragIndex = null;
  // 拖动完成后按协议下发当前曲线的 8 个点
  sendJoystickSensitivity(activeTab.value === "右摇杆", points.value);
}

function onDragMove(evt) {
  if (dragIndex === null || !chartSvg.value) return;

  // 屏幕坐标 → SVG 坐标（viewBox 为 620 x 500）
  const rect = chartSvg.value.getBoundingClientRect();
  const svgX = ((evt.clientX - rect.left) / rect.width) * 620;
  const svgY = ((evt.clientY - rect.top) / rect.height) * 500;

  const rawIn = ((svgX - CHART.left) / (CHART.right - CHART.left)) * 100;
  const rawOut = ((CHART.bottom - svgY) / (CHART.bottom - CHART.top)) * 100;

  const i = dragIndex;
  const pts = points.value;
  const prev = i > 0 ? pts[i - 1] : null;
  const next = i < pts.length - 1 ? pts[i + 1] : null;

  // 每个点取值范围 0-100，且必须大于前一个点、小于后一个点
  const minIn = prev ? prev.in + 1 : 0;
  const maxIn = next ? next.in - 1 : 100;
  const minOut = prev ? prev.out + 1 : 0;
  const maxOut = next ? next.out - 1 : 100;

  // 最后一个点仅可上下拖动，X 固定为 100
  if (i < pts.length - 1 && minIn <= maxIn) {
    pts[i].in = clamp(Math.round(rawIn), minIn, maxIn);
  }
  if (minOut <= maxOut) {
    pts[i].out = clamp(Math.round(rawOut), minOut, maxOut);
  }

  activePreset.value = "自定义";
  lastValidPoints = pts.map((p) => ({ ...p }));
}
</script>

<style scoped>
/* 数字输入框的上下调节按钮始终显示，不随焦点/悬停隐藏 */
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  opacity: 1;
  height: 1.25rem;
  /* 深色背景下反色，保证箭头清晰可见 */
  filter: invert(0.85);
}
</style>
