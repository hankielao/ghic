<template>
  <div class="p-6">
    <div class="flex gap-2">
      <button
        v-for="tab in tabs"
        :key="tab"
        class="px-5 py-2 rounded-lg font-medium text-white transition-colors duration-150"
        :class="activeTab === tab ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'"
        @click="activeTab = tab"
      >
        {{ tab }}
      </button>
    </div>

    <!-- 摇杆校准 -->
    <div v-if="activeTab === '摇杆校准'" class="mt-5">
      <p class="text-gray-300 mb-4">点击开始校准，摇杆推到底转三圈，点击校准完成</p>
      <button
        class="px-6 py-2.5 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-150"
        @click="onStickCalibrate"
      >
        {{ stickCalibrating ? "校准完成" : "开始校准" }}
      </button>
    </div>

    <!-- 扳机校准 -->
    <div v-if="activeTab === '扳机校准'" class="mt-5">
      <p class="text-gray-300 mb-4">
        点击开始校准，将扳机按到底再完全松开，重复3次后点击校准完成
      </p>
      <button
        class="px-6 py-2.5 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-150"
        @click="onTriggerCalibrate"
      >
        {{ triggerCalibrating ? "校准完成" : "开始校准" }}
      </button>
    </div>

    <!-- 体感校准 -->
    <div v-if="activeTab === '体感校准'" class="mt-5">
      <p class="text-gray-300 mb-4">手柄平放桌面，点击开始，等待5-10秒后点击校准完成。</p>
      <button
        class="px-6 py-2.5 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-150"
        @click="onMotionCalibrate"
      >
        {{ motionCalibrating ? "校准完成" : "开始校准" }}
      </button>
    </div>

    <!-- 校准结果临时提示 -->
    <div
      v-if="toast"
      class="fixed top-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-lg text-white font-medium shadow-lg"
      :class="toast.ok ? 'bg-green-600' : 'bg-red-600'"
    >
      {{ toast.text }}
    </div>
  </div>
</template>

<script setup>
import { ref, onUnmounted } from "vue";
import { useDeviceCommand } from "../composables/useDeviceCommand";
import { useHidDevice } from "../composables/useHidDevice";

const tabs = ["摇杆校准", "扳机校准", "体感校准"];
const activeTab = ref(tabs[0]);

const {
  startStickCalibration,
  finishStickCalibration,
  startTriggerCalibration,
  finishTriggerCalibration,
  startMotionCalibration,
  finishMotionCalibration,
} = useDeviceCommand();
const stickCalibrating = ref(false);
const triggerCalibrating = ref(false);
const motionCalibrating = ref(false);

// 接收数据标准头：30 55 aa；校准回复 ID = 0xD1
const HEADER = [0x30, 0x55, 0xaa];
const CALIB_REPLY_ID = 0xd1;
// 等待校准回复的超时时间
const REPLY_TIMEOUT = 3000;

const toast = ref(null);
let toastTimer = null;
// 期望的回复末字节，null 表示当前不在等待回复
let expectedByte = null;
let replyTimer = null;

function showToast(text, ok) {
  toast.value = { text, ok };
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.value = null;
  }, 2000);
}

function stopWaiting() {
  expectedByte = null;
  clearTimeout(replyTimer);
}

// 发送结束校准指令，并等待设备回复比对末字节
async function sendAndVerify(send, byte) {
  const ok = await send();
  if (!ok) return;
  expectedByte = byte;
  clearTimeout(replyTimer);
  replyTimer = setTimeout(() => {
    expectedByte = null;
    showToast("校准失败", false);
  }, REPLY_TIMEOUT);
}

async function onStickCalibrate() {
  // 接入校准：只发送，不校验回复、不弹窗
  if (!stickCalibrating.value) {
    const ok = await startStickCalibration();
    if (ok) stickCalibrating.value = true;
    return;
  }
  stickCalibrating.value = false;
  await sendAndVerify(finishStickCalibration, 0x00);
}

async function onTriggerCalibrate() {
  // 接入校准：只发送，不校验回复、不弹窗
  if (!triggerCalibrating.value) {
    const ok = await startTriggerCalibration();
    if (ok) triggerCalibrating.value = true;
    return;
  }
  triggerCalibrating.value = false;
  await sendAndVerify(finishTriggerCalibration, 0x00);
}

async function onMotionCalibrate() {
  // 接入校准：只发送，不校验回复、不弹窗
  if (!motionCalibrating.value) {
    const ok = await startMotionCalibration();
    if (ok) motionCalibrating.value = true;
    return;
  }
  motionCalibrating.value = false;
  await sendAndVerify(finishMotionCalibration, 0x00);
}

const { subscribeInputReport } = useHidDevice();

const unsubscribe = subscribeInputReport((data) => {
  if (expectedByte === null) return;
  if (data.length < HEADER.length + 1) return;
  if (HEADER.some((b, i) => data[i] !== b)) return;
  const payload = data.subarray(HEADER.length);
  if (payload[0] !== CALIB_REPLY_ID) return;

  // 接收帧与发送帧末字节一致即为成功
  const success = data[data.length - 1] === expectedByte;
  stopWaiting();
  showToast(success ? "校准成功" : "校准失败", success);
});

onUnmounted(() => {
  unsubscribe();
  clearTimeout(toastTimer);
  clearTimeout(replyTimer);
});
</script>