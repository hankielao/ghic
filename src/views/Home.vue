<template>
  <div class="p-6">
    <!-- 第一行：电量 / 版本 / 休眠时间 -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- 电量 -->
      <div class="rounded-2xl border border-gray-700/60 bg-gray-800/40 p-6">
        <div class="flex items-center justify-between">
          <span class="text-white font-semibold">电量</span>
          <span class="text-xs text-gray-500">手柄电量状态</span>
        </div>
        <div class="mt-3 border-t border-gray-700"></div>
        <div class="mt-6 text-3xl font-bold text-white">{{ battery }}</div>
      </div>

      <!-- 版本 -->
      <div class="rounded-2xl border border-gray-700/60 bg-gray-800/40 p-6">
        <div class="flex items-center justify-between">
          <span class="text-white font-semibold">版本</span>
          <span class="text-xs text-gray-500">手柄固件版本</span>
        </div>
        <div class="mt-3 border-t border-gray-700"></div>
        <div class="mt-6 text-3xl font-bold text-white">{{ version }}</div>
      </div>

      <!-- 休眠时间 -->
      <div class="rounded-2xl border border-gray-700/60 bg-gray-800/40 p-6">
        <div class="flex items-center justify-between">
          <span class="text-white font-semibold">休眠时间</span>
          <span class="text-xs text-gray-500">调整手柄休眠时间</span>
        </div>
        <div class="mt-3 border-t border-gray-700"></div>
        <div class="relative mt-6 w-40">
          <select
            v-model.number="sleepValue"
            class="w-full appearance-none px-4 py-2 pr-10 rounded-full bg-gray-900 border border-gray-700 text-white text-sm cursor-pointer"
            @change="onSleepChange"
          >
            <option v-for="opt in sleepOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
          <svg
            class="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M6 8l4 4 4-4" />
          </svg>
        </div>
      </div>
    </div>

    <!-- 第二行：回报率 / 步进 -->
    <div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="rounded-2xl border border-gray-700/60 bg-gray-800/40 p-6">
        <div class="text-white font-semibold">回报率</div>
      <div class="mt-1 text-xs text-gray-500">
        回报率越高，手柄响应越灵敏，但功耗也越高。
      </div>

      <!-- USB -->
      <div class="mt-5">
        <div class="text-white text-sm font-medium">USB</div>
        <div class="mt-3 flex flex-wrap gap-3">
          <button
            v-for="opt in usbOptions"
            :key="opt.value"
            class="px-5 py-2 rounded-lg text-sm"
            :class="
              rate.usb === opt.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700/60 text-gray-300 hover:bg-gray-700'
            "
            @click="onRateChange('usb', opt.value)"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>

      <div class="mt-5 border-t border-gray-700"></div>

      <!-- 2.4G 无线 -->
      <div class="mt-5">
        <div class="text-white text-sm font-medium">2.4G无线</div>
        <div class="mt-3 flex flex-wrap gap-3">
          <button
            v-for="opt in wifiOptions"
            :key="opt.value"
            class="px-5 py-2 rounded-lg text-sm"
            :class="
              rate.wifi === opt.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700/60 text-gray-300 hover:bg-gray-700'
            "
            @click="onRateChange('wifi', opt.value)"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>

      <div class="mt-5 border-t border-gray-700"></div>

      <!-- 蓝牙 -->
      <div class="mt-5">
        <div class="text-white text-sm font-medium">蓝牙</div>
        <div class="mt-3 flex flex-wrap gap-3">
          <button
            v-for="opt in bleOptions"
            :key="opt.value"
            class="px-5 py-2 rounded-lg text-sm"
            :class="
              rate.ble === opt.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700/60 text-gray-300 hover:bg-gray-700'
            "
            @click="onRateChange('ble', opt.value)"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>
    </div>

      <!-- 步进 -->
      <div class="rounded-2xl border border-gray-700/60 bg-gray-800/40 p-6">
        <div class="flex items-center justify-between">
          <span class="text-white font-semibold">步进</span>
          <span class="text-xs text-gray-500">调整摇杆步长</span>
        </div>
        <div class="mt-3 border-t border-gray-700"></div>

        <div class="mt-6 flex items-center gap-3">
          <input
            v-model.number="stepValue"
            type="range"
            min="0"
            max="255"
            class="flex-1 accent-blue-600 cursor-pointer"
            @change="onStepCommit"
          />
          <input
            v-model.number="stepValue"
            type="number"
            min="0"
            max="255"
            class="w-20 px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-white text-sm"
            @change="onStepCommit"
          />
          <span class="text-xs text-gray-500 whitespace-nowrap">范围 0-255</span>
        </div>

        <p class="mt-3 text-xs text-gray-500">
          设置摇杆的步长，步长越小，摇杆对细微输出越敏感，步长越大则越钝。
        </p>
      </div>
    </div>

    <!-- 第三行：轴设置 / 恢复出厂设置 -->
    <div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="rounded-2xl border border-gray-700/60 bg-gray-800/40 p-6">
      <div class="flex items-center justify-between">
        <span class="text-white font-semibold">轴设置</span>
        <span class="text-xs text-gray-500">调整摇杆与十字键的映射</span>
      </div>
      <div class="mt-3 border-t border-gray-700"></div>
      <div class="relative mt-6 w-72">
        <select
          v-model.number="axisValue"
          class="w-full appearance-none px-4 py-2 pr-10 rounded-full bg-gray-900 border border-gray-700 text-white text-sm cursor-pointer"
          @change="onAxisChange"
        >
          <option v-for="opt in axisOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
        <svg
          class="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M6 8l4 4 4-4" />
        </svg>
      </div>
      </div>

      <!-- 恢复出厂设置 -->
      <div class="rounded-2xl border border-gray-700/60 bg-gray-800/40 p-6">
        <div class="flex items-center justify-between">
          <span class="text-white font-semibold">恢复出厂设置</span>
          <span class="text-xs text-gray-500">恢复手柄默认配置</span>
        </div>
        <div class="mt-3 border-t border-gray-700"></div>
        <button
          class="mt-6 px-6 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-500"
          @click="onResetFactory"
        >
          恢复出厂设置
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { useDeviceCommand } from "../composables/useDeviceCommand";
import { useHidDevice } from "../composables/useHidDevice";

// 回复帧固定头 30 55 aa，其后为 ID / CMD
const HEADER = [0x30, 0x55, 0xaa];
const REPLY_ID = 0xd0;
const REPLY_ID_SET = 0xd1;
const CMD_RESET_FACTORY = 0x04;
const CMD_DEVICE_INFO = 0x01;
const CMD_SLEEP_GET = 0x0f;
const CMD_RATE_GET = 0x11;
const CMD_STEP_GET = 0x0d;
const CMD_AXIS_GET = 0x08;

// 休眠时间选项：01=15min，02=60min，03=不休眠
const sleepOptions = [
  { label: "15分钟", value: 0x01 },
  { label: "60分钟", value: 0x02 },
  { label: "不休眠", value: 0x03 },
];

// 回报率选项：编码即下发值
const usbOptions = [
  { label: "125Hz", value: 0x00 },
  { label: "250Hz", value: 0x01 },
  { label: "500Hz", value: 0x02 },
  { label: "1000Hz", value: 0x03 },
  { label: "2000Hz", value: 0x04 },
  { label: "4000Hz", value: 0x05 },
  { label: "8000Hz", value: 0x06 },
];
const wifiOptions = [
  { label: "125Hz", value: 0x01 },
  { label: "250Hz", value: 0x02 },
  { label: "500Hz", value: 0x03 },
  { label: "1000Hz", value: 0x04 },
];
const bleOptions = [
  { label: "125Hz", value: 0x01 },
  { label: "250Hz", value: 0x02 },
];

// 轴设置选项
const axisOptions = [
  { label: "不互换", value: 0x00 },
  { label: "左摇杆和十字键互换", value: 0x01 },
  { label: "右摇杆和十字键互换", value: 0x02 },
  { label: "左右摇杆互换", value: 0x03 },
];

const battery = ref("--");
const version = ref("--");
const sleepValue = ref(0x01);
const rate = ref({ usb: 0x00, wifi: 0x04, ble: 0x02 });
const stepValue = ref(0x00);
const axisValue = ref(0x00);

const {
  requestDeviceInfo,
  requestSleepTime,
  setSleepTime,
  requestRefreshRate,
  setRefreshRate,
  requestStep,
  setStep,
  requestAxis,
  setAxis,
  resetFactory,
} = useDeviceCommand();
const { subscribeInputReport } = useHidDevice();

let unsubscribe = null;

onMounted(() => {
  unsubscribe = subscribeInputReport(handleReport);
  requestDeviceInfo();
});

onUnmounted(() => {
  if (unsubscribe) unsubscribe();
});

function handleReport(data) {
  if (data.length < 7) return;
  if (data[0] !== HEADER[0] || data[1] !== HEADER[1] || data[2] !== HEADER[2]) return;

  // 恢复出厂设置回复：ID 0xD1，CMD 0x04 → 重新读取本页全部设置
  if (data[3] === REPLY_ID_SET && data[4] === CMD_RESET_FACTORY) {
    requestDeviceInfo();
    return;
  }

  if (data[3] !== REPLY_ID) return;

  // 设备信息回复：ID 0xD0，CMD 0x01
  if (data[4] === CMD_DEVICE_INFO) {
    if (data.length < 11) return;
    // 大版本号 / 小版本号高 / 小版本号低 / 电量(0-100)
    version.value = `V${data[7]}.${data[8]}${data[9]}`;
    battery.value = `${data[10]}%`;
    // 获取到电量与版本后，再读取休眠时间
    requestSleepTime();
    return;
  }

  // 休眠时间回复：ID 0xD0，CMD 0x0F，data[6] 为当前档位
  if (data[4] === CMD_SLEEP_GET) {
    sleepValue.value = data[6];
    // 读取休眠时间后，再读取回报率
    requestRefreshRate();
    return;
  }

  // 回报率回复：ID 0xD0，CMD 0x11，data[6..8] 依次为 USB / 2.4G / 蓝牙
  if (data[4] === CMD_RATE_GET) {
    if (data.length < 9) return;
    rate.value = {
      usb: data[6],
      // 2.4G 的 0 与 4 均为 1000Hz，统一归到 4
      wifi: data[7] === 0 ? 0x04 : data[7],
      // 蓝牙的 0 与 2 均为 250Hz，统一归到 2
      ble: data[8] === 0 ? 0x02 : data[8],
    };
    // 读取回报率后，再读取步进
    requestStep();
    return;
  }

  // 步进回复：ID 0xD0，CMD 0x0D，data[6] 为步长 0-255
  if (data[4] === CMD_STEP_GET) {
    stepValue.value = data[6];
    // 读取步进后，再读取轴设置
    requestAxis();
    return;
  }

  // 轴设置回复：ID 0xD0，CMD 0x08，data[6] 为轴设置档位
  if (data[4] === CMD_AXIS_GET) {
    axisValue.value = data[6];
  }
}

function onSleepChange() {
  setSleepTime(sleepValue.value);
}

function onRateChange(group, value) {
  rate.value = { ...rate.value, [group]: value };
  setRefreshRate(rate.value.usb, rate.value.wifi, rate.value.ble);
}

function onStepCommit() {
  let v = Number(stepValue.value);
  if (!Number.isFinite(v)) v = 0;
  v = Math.min(255, Math.max(0, Math.round(v)));
  stepValue.value = v;
  setStep(v);
}

function onAxisChange() {
  setAxis(axisValue.value);
}

function onResetFactory() {
  resetFactory();
}
</script>

<style scoped>
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  opacity: 1;
  height: 1.25rem;
  filter: invert(0.85);
}
</style>