<template>
  <div class="p-6">
    <div class="flex gap-5 items-start">
      <!-- 左马达卡片 -->
      <div class="flex-1 rounded-2xl bg-gray-800/50 border border-gray-700 p-5">
        <h2 class="text-xl font-bold mb-4">左马达</h2>
        <div class="flex items-center gap-3">
          <input
            v-model.number="motorValues.left"
            type="range"
            min="0"
            max="100"
            class="flex-1 accent-blue-600 cursor-pointer"
            @change="sendMotor"
          />
          <div class="flex items-center rounded bg-gray-900 border border-gray-700 overflow-hidden">
            <input
              v-model.number="motorValues.left"
              type="number"
              min="0"
              max="100"
              class="w-16 px-2 py-1.5 bg-transparent text-white text-sm text-center outline-none no-spinner"
              @change="clampMotor('left')"
            />
            <div class="flex flex-col border-l border-gray-700">
              <button
                class="px-1.5 py-0.5 text-[10px] leading-none text-gray-400 hover:text-white transition-colors duration-150"
                @click="stepMotor('left', 1)"
              >
                ▲
              </button>
              <button
                class="px-1.5 py-0.5 text-[10px] leading-none text-gray-400 hover:text-white border-t border-gray-700 transition-colors duration-150"
                @click="stepMotor('left', -1)"
              >
                ▼
              </button>
            </div>
          </div>
          <span class="text-xs text-gray-500 whitespace-nowrap">范围 0-100</span>
        </div>
      </div>

      <!-- 右马达卡片 -->
      <div class="flex-1 rounded-2xl bg-gray-800/50 border border-gray-700 p-5">
        <h2 class="text-xl font-bold mb-4">右马达</h2>
        <div class="flex items-center gap-3">
          <input
            v-model.number="motorValues.right"
            type="range"
            min="0"
            max="100"
            class="flex-1 accent-blue-600 cursor-pointer"
            @change="sendMotor"
          />
          <div class="flex items-center rounded bg-gray-900 border border-gray-700 overflow-hidden">
            <input
              v-model.number="motorValues.right"
              type="number"
              min="0"
              max="100"
              class="w-16 px-2 py-1.5 bg-transparent text-white text-sm text-center outline-none no-spinner"
              @change="clampMotor('right')"
            />
            <div class="flex flex-col border-l border-gray-700">
              <button
                class="px-1.5 py-0.5 text-[10px] leading-none text-gray-400 hover:text-white transition-colors duration-150"
                @click="stepMotor('right', 1)"
              >
                ▲
              </button>
              <button
                class="px-1.5 py-0.5 text-[10px] leading-none text-gray-400 hover:text-white border-t border-gray-700 transition-colors duration-150"
                @click="stepMotor('right', -1)"
              >
                ▼
              </button>
            </div>
          </div>
          <span class="text-xs text-gray-500 whitespace-nowrap">范围 0-100</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, onMounted, onUnmounted } from "vue";
import { useHidDevice } from "../composables/useHidDevice";
import { useDeviceCommand } from "../composables/useDeviceCommand";

// 接收数据标准头：30 55 aa
const HEADER = [0x30, 0x55, 0xaa];

// 左/右马达强度 0-100
const motorValues = reactive({ left: 0, right: 0 });

const { connected, subscribeInputReport } = useHidDevice();
const { requestMotorVibration, setMotorVibration } = useDeviceCommand();

// 下发马达震动：左/右扳机马达跟随手柄马达值，模式固定 0x00 原生扳机震动
function sendMotor() {
  setMotorVibration(motorValues.left, motorValues.right);
}

// 步进调整（上下箭头）：调整后立即下发
function stepMotor(m, dir) {
  const v = (Number(motorValues[m]) || 0) + dir;
  motorValues[m] = Math.min(100, Math.max(0, v));
  sendMotor();
}

// 手动输入提交时钳制到 0-100 并下发
function clampMotor(m) {
  let v = Math.round(Number(motorValues[m]));
  if (!Number.isFinite(v)) v = 0;
  motorValues[m] = Math.min(100, Math.max(0, v));
  sendMotor();
}

// 马达震动回复：0xD0 ID, 0x0C CMD, Device Mode, 左手柄马达, 右手柄马达, 左/右扳机马达, 震动模式
// 页面只显示左右手柄马达
const unsubscribe = subscribeInputReport((data) => {
  if (data.length < 8) return;
  if (HEADER.some((b, i) => data[i] !== b)) return;
  if (data[3] !== 0xd0 || data[4] !== 0x0c) return;
  motorValues.left = data[6];
  motorValues.right = data[7];
});

onMounted(() => {
  if (connected.value) requestMotorVibration();
});

onUnmounted(() => {
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
