<template>
  <div class="p-6">
    <div class="flex gap-5 items-start">
      <!-- 按键映射卡片 -->
      <div class="w-2/3 rounded-2xl bg-gray-800/50 border border-gray-700 p-5">
        <h2 class="text-xl font-bold mb-4">按键设置</h2>
        <div class="grid grid-cols-2 gap-x-24">
          <!-- 源按键分两列，右侧各自跟一列映射功能按键 -->
          <div
            v-for="(col, ci) in columns"
            :key="ci"
            class="grid grid-cols-[5.5rem_max-content_auto] items-center gap-y-3"
          >
            <template v-for="m in col" :key="m.code">
              <button
                class="mr-3 rounded-lg bg-gray-900/60 border border-gray-600 px-3 py-2 text-center font-semibold text-white transition-colors duration-150 hover:border-gray-500"
              >
                {{ m.source }}
              </button>

              <svg class="w-8 h-4 text-gray-500" viewBox="0 0 32 16" fill="none">
                <path d="M0 8H27" stroke="currentColor" stroke-width="1.5" />
                <path d="M23 2L30 8L23 14" stroke="currentColor" stroke-width="1.5" />
              </svg>

              <button
                class="rounded-lg bg-gray-900/60 border border-gray-600 px-3 py-2 text-left font-semibold text-white transition-colors duration-150 hover:border-gray-500 cursor-pointer"
                @click="openEdit(m)"
              >
                {{ m.target }}
              </button>
            </template>
          </div>
        </div>
      </div>

      <!-- 宏卡片 -->
      <div class="flex-1 rounded-2xl bg-gray-800/50 border border-gray-700 p-5">
        <h2 class="text-xl font-bold mb-4">宏</h2>
        <div class="flex gap-3">
          <div v-for="macro in macros" :key="macro" class="relative flex-1">
            <button
              class="w-full flex items-center justify-between rounded-lg bg-gray-900/60 border border-gray-600 px-4 py-2 font-semibold text-white transition-colors duration-150"
              :class="macroMenu === macro ? 'border-gray-500' : 'hover:border-gray-500'"
              @click="toggleMacroMenu(macro)"
            >
              <span>{{ macro }}</span>
              <span class="text-xs text-gray-400">▼</span>
            </button>

            <!-- 映射 / 宏设置 下拉菜单 -->
            <div
              v-if="macroMenu === macro"
              class="absolute left-0 right-0 top-full mt-1 z-40 rounded-lg bg-gray-900 border border-gray-600 py-1 shadow-xl"
            >
              <button
                class="w-full px-4 py-2 text-left text-sm text-gray-200 hover:bg-gray-800 transition-colors duration-150"
                @click="onMacroMap(macro)"
              >
                映射
              </button>
              <button
                class="w-full flex items-center justify-between px-4 py-2 text-left text-sm text-gray-200 hover:bg-gray-800 transition-colors duration-150"
                @click="onMacroSettings(macro)"
              >
                宏设置
                <span class="text-gray-400">›</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 点击空白处关闭宏下拉菜单 -->
    <div v-if="macroMenu" class="fixed inset-0 z-30" @click="macroMenu = null"></div>

    <!-- 映射功能按键选择弹窗 -->
    <div
      v-if="editing"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      @click.self="closeEdit"
    >
      <div class="w-[907px] rounded-2xl bg-gray-900 border border-gray-700 p-6">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-white-500">{{ editing.source }}键</h3>
          <button
            class="w-7 h-7 rounded-full bg-gray-800 text-gray-400 hover:text-white transition-colors duration-150"
            @click="closeEdit"
          >
            ✕
          </button>
        </div>

        <div class="mt-5 rounded-xl border border-gray-700 p-6">
          <div class="grid grid-cols-6 gap-3 w-fit mx-auto">
            <button
              v-for="k in FUNCTION_KEYS"
              :key="k.value"
              class="px-4 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150"
              :class="
                selection.includes(k.value)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-100 hover:bg-gray-700'
              "
              @click="toggleKey(k.value)"
            >
              {{ k.short }}
            </button>
          </div>

          <!-- 当前选中的功能按键（最多 2 个） -->
          <div v-if="selection.length" class="mt-5 flex justify-center">
            <span class="rounded border border-gray-600 bg-gray-800 px-3 py-1 text-xs text-gray-200">
              {{ selectedLabel }}
            </span>
          </div>
        </div>

        <!-- 连发功能 -->
        <div class="mt-4 rounded-xl border border-gray-700 p-5">
          <div class="flex items-center gap-4">
            <span class="text-sm font-semibold text-white whitespace-nowrap">连发功能</span>
            <div class="inline-flex rounded-lg overflow-hidden border border-gray-700">
              <button
                v-for="opt in turboOptions"
                :key="opt.value"
                class="px-5 py-1.5 text-sm font-medium transition-colors duration-150"
                :class="
                  turboMode === opt.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                "
                @click="turboMode = opt.value"
              >
                {{ opt.label }}
              </button>
            </div>

            <span class="ml-4 text-sm font-semibold text-white whitespace-nowrap">连发速度</span>
            <input
              v-model.number="turboSpeed"
              type="range"
              min="1"
              max="30"
              :disabled="turboMode === 0"
              class="flex-1 accent-blue-600 cursor-pointer disabled:cursor-not-allowed"
              @change="commitTurboSpeed"
            />
            <div class="flex items-center gap-1">
              <button
                class="w-7 h-7 rounded bg-gray-800 text-gray-300 hover:text-white transition-colors duration-150 disabled:text-gray-600 disabled:cursor-not-allowed"
                :disabled="turboMode === 0 || turboSpeed <= 1"
                @click="stepTurboSpeed(-1)"
              >
                -
              </button>
              <input
                v-model.number="turboSpeed"
                type="number"
                min="1"
                max="30"
                :disabled="turboMode === 0"
                class="w-14 px-2 py-1 rounded bg-gray-900 border border-gray-700 text-white text-sm text-center disabled:text-gray-500 disabled:cursor-not-allowed"
                @change="commitTurboSpeed"
              />
              <button
                class="w-7 h-7 rounded bg-gray-800 text-gray-300 hover:text-white transition-colors duration-150 disabled:text-gray-600 disabled:cursor-not-allowed"
                :disabled="turboMode === 0 || turboSpeed >= 30"
                @click="stepTurboSpeed(1)"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div class="mt-5 flex justify-end gap-3">
          <button
            class="px-6 py-2 rounded-lg bg-gray-700 text-white text-sm hover:bg-gray-600 transition-colors duration-150"
            @click="closeEdit"
          >
            取消
          </button>
          <button
            class="px-6 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-500 transition-colors duration-150 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed"
            :disabled="!selection.length"
            @click="confirmEdit"
          >
            确认
          </button>
        </div>
      </div>
    </div>
    <!-- M1/M2 映射弹窗 -->
    <div
      v-if="macroEditing !== null"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      @click.self="closeMacroEdit"
    >
      <div class="w-[907px] rounded-2xl bg-gray-900 border border-gray-700 p-6">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-white-500">{{ macros[macroEditing] }}键</h3>
          <button
            class="w-7 h-7 rounded-full bg-gray-800 text-gray-400 hover:text-white transition-colors duration-150"
            @click="closeMacroEdit"
          >
            ✕
          </button>
        </div>

        <div class="mt-5 rounded-xl border border-gray-700 p-6">
          <div class="grid grid-cols-6 gap-3 w-fit mx-auto">
            <button
              v-for="k in FUNCTION_KEYS"
              :key="k.value"
              class="px-4 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150"
              :class="
                macroKey === k.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-100 hover:bg-gray-700'
              "
              @click="macroKey = k.value"
            >
              {{ k.short }}
            </button>
          </div>

          <!-- 当前选中的功能按键（单选） -->
          <div v-if="macroKey !== null" class="mt-5 flex justify-center">
            <span class="rounded border border-gray-600 bg-gray-800 px-3 py-1 text-xs text-gray-200">
              {{ functionKey(macroKey)?.short || "--" }}
            </span>
          </div>
        </div>

        <!-- 连发方式 / 连发模式 -->
        <div class="mt-4 rounded-xl border border-gray-700 p-5">
          <div class="flex items-center gap-4">
            <span class="text-sm font-semibold text-white whitespace-nowrap">连发方式</span>
            <div class="inline-flex rounded-lg overflow-hidden border border-gray-700">
              <button
                v-for="opt in macroTriggerOptions"
                :key="opt.value"
                class="px-5 py-1.5 text-sm font-medium transition-colors duration-150"
                :class="
                  macroTriggerMode === opt.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                "
                @click="macroTriggerMode = opt.value"
              >
                {{ opt.label }}
              </button>
            </div>

            <span class="ml-4 text-sm font-semibold text-white whitespace-nowrap">连发模式</span>
            <div class="inline-flex rounded-lg overflow-hidden border border-gray-700">
              <button
                v-for="opt in macroLoopOptions"
                :key="opt.value"
                class="px-5 py-1.5 text-sm font-medium transition-colors duration-150"
                :class="
                  macroLoop === opt.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                "
                @click="macroLoop = opt.value"
              >
                {{ opt.label }}
              </button>
            </div>
          </div>
        </div>

        <div class="mt-5 flex justify-end gap-3">
          <button
            class="px-6 py-2 rounded-lg bg-gray-700 text-white text-sm hover:bg-gray-600 transition-colors duration-150"
            @click="closeMacroEdit"
          >
            取消
          </button>
          <button
            class="px-6 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-500 transition-colors duration-150 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed"
            :disabled="macroKey === null || macroSetting"
            @click="confirmMacroEdit"
          >
            {{ macroSetting ? "确认中…" : "确认" }}
          </button>
        </div>
      </div>
    </div>

    <!-- M1/M2 设置宏弹窗 -->
    <div
      v-if="macroConfiguring !== null"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      @click.self="closeMacroConfig"
    >
      <div class="w-[800px] rounded-2xl bg-gray-900 border border-gray-700 p-6">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-white-500">设置宏</h3>
          <button
            class="w-7 h-7 rounded-full bg-gray-800 text-gray-400 hover:text-white transition-colors duration-150"
            @click="closeMacroConfig"
          >
            ✕
          </button>
        </div>

        <!-- 当前编辑 / 数据条数 -->
        <div class="mt-4 flex items-center justify-between text-sm text-gray-300">
          <span>当前编辑：{{ macros[macroConfiguring] }}</span>
          <span>数据条数：{{ macroConfigCount }}/{{ MACRO_MAX_STEPS }}</span>
        </div>

        <!-- 录制控制 -->
        <div class="mt-4 flex items-center justify-between">
          <div class="flex gap-3">
            <button
              class="px-5 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150 disabled:cursor-not-allowed"
              :class="
                macroRecording
                  ? 'bg-gray-700 text-gray-500'
                  : 'bg-blue-600 text-white hover:bg-blue-500'
              "
              :disabled="macroRecording"
              @click="startMacroRecording"
            >
              开始录制
            </button>
            <button
              class="px-5 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150 disabled:cursor-not-allowed"
              :class="
                macroRecording
                  ? 'bg-blue-600 text-white hover:bg-blue-500'
                  : 'bg-gray-700 text-gray-500'
              "
              :disabled="!macroRecording"
              @click="stopMacroRecording"
            >
              结束录制
            </button>
          </div>
          <button
            class="px-5 py-1.5 rounded-lg bg-gray-800 text-gray-200 text-sm font-medium hover:bg-gray-700 transition-colors duration-150"
            @click="clearMacroSteps"
          >
            清空数据
          </button>
        </div>

        <!-- 宏数据列表 -->
        <div class="mt-4 h-64 rounded-xl border border-gray-700 p-4 overflow-y-auto">
          <!-- 空状态：悬浮时 ＋ 高亮，点击添加一组默认宏数据 -->
          <div
            v-if="!macroConfigSteps.length"
            class="w-full h-full flex items-center justify-center text-gray-500"
          >
            <button
              class="flex items-center gap-2 transition-colors duration-150 hover:text-blue-400"
              @click="addMacroStep()"
            >
              <span class="text-xl leading-none">＋</span>
              <span>------当前宏为空</span>
            </button>
          </div>

          <!-- 每组宏数据：序号 + 键帽点击换键，悬浮显示删除按钮 / 加号，时间点击编辑，间隔靠后 -->
          <div
            v-for="(step, i) in macroConfigSteps"
            :key="i"
            class="group flex items-center gap-3 py-1.5"
          >
            <!-- 序号：从 1 开始，最大 20 -->
            <span class="w-6 text-sm text-gray-500 text-right">{{ i + 1 }}</span>

            <!-- 功能键：固定宽度圆角矩形键帽（可容纳最长标签 L_Left），点击弹出修改宏按键弹窗；右上角删除按钮（悬浮显示） -->
            <div class="relative">
              <button
                class="w-24 rounded bg-gray-800 border border-gray-600 hover:border-blue-600 hover:text-blue-600 px-2 py-1.5 text-sm font-semibold text-white text-center transition-colors duration-150"
                @click="openMacroKeyEdit(i)"
              >
                {{ functionKey(step.key)?.short || "--" }}
              </button>
              <button
                class="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gray-700 border border-gray-600 text-gray-300 text-xs leading-none opacity-0 group-hover:opacity-100 hover:bg-red-600 hover:border-red-600 hover:text-white transition-all duration-150"
                @click="removeMacroStep(i)"
              >
                ×
              </button>
            </div>

            <!-- 持续时间：点击进入编辑 -->
            <template v-if="isEditingTime(i, 'duration')">
              <span class="text-sm text-gray-500">持续</span>
              <input
                v-focus
                v-model.number="macroTimeValue"
                type="number"
                min="0"
                step="10"
                class="w-20 px-2 py-1 rounded bg-gray-900 border border-blue-500 text-white text-sm text-center outline-none"
                @keyup.enter="commitMacroTime"
                @blur="commitMacroTime"
              />
              <span class="text-sm text-gray-500">ms</span>
            </template>
            <button
              v-else
              class="w-32 rounded bg-gray-800 border border-gray-600 px-2 py-1 text-sm text-gray-200 text-center hover:border-blue-600 hover:text-blue-600 transition-colors duration-150"
              @click="macroTimeEditing = { index: i, field: 'duration' }"
            >
              持续{{ step.duration }}ms
            </button>

            <!-- 弹性空间：把间隔推到行尾 -->
            <div class="flex-1"></div>

            <!-- 间隔：点击进入编辑 -->
            <template v-if="isEditingTime(i, 'delay')">
              <span class="text-sm text-gray-500">间隔</span>
              <input
                v-focus
                v-model.number="macroTimeValue"
                type="number"
                min="0"
                step="10"
                class="w-20 px-2 py-1 rounded bg-gray-900 border border-blue-500 text-white text-sm text-center outline-none"
                @keyup.enter="commitMacroTime"
                @blur="commitMacroTime"
              />
              <span class="text-sm text-gray-500">ms</span>
            </template>
            <button
              v-else
              class="w-32 rounded bg-gray-800 border border-gray-600 px-2 py-1 text-sm text-gray-200 text-center hover:border-blue-600 hover:text-blue-600 transition-colors duration-150"
              @click="macroTimeEditing = { index: i, field: 'delay' }"
            >
              间隔{{ step.delay }}ms
            </button>

            <!-- 加号：悬浮显示，点击在该组后插入一组默认数据；满 20 条时不显示 -->
            <button
              v-if="macroConfigSteps.length < MACRO_MAX_STEPS"
              class="w-7 h-7 rounded-full text-gray-400 text-lg leading-none opacity-0 group-hover:opacity-100 hover:text-blue-400 transition-all duration-150"
              @click="addMacroStep(i + 1)"
            >
              ＋
            </button>
          </div>
        </div>

        <!-- 触发方式 / 循环模式 -->
        <div class="mt-4 rounded-xl border border-gray-700 p-5">
          <div class="flex items-center gap-4">
            <span class="text-sm font-semibold text-white whitespace-nowrap">触发方式</span>
            <div class="inline-flex rounded-lg overflow-hidden border border-gray-700">
              <button
                v-for="opt in macroTriggerOptions"
                :key="opt.value"
                class="px-5 py-1.5 text-sm font-medium transition-colors duration-150"
                :class="
                  macroConfigTrigger === opt.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                "
                @click="macroConfigTrigger = opt.value"
              >
                {{ opt.label }}
              </button>
            </div>

            <span class="ml-4 text-sm font-semibold text-white whitespace-nowrap">循环模式</span>
            <div class="inline-flex rounded-lg overflow-hidden border border-gray-700">
              <button
                v-for="opt in macroLoopOptions"
                :key="opt.value"
                class="px-5 py-1.5 text-sm font-medium transition-colors duration-150"
                :class="
                  macroConfigLoop === opt.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                "
                @click="macroConfigLoop = opt.value"
              >
                {{ opt.label }}
              </button>
            </div>
          </div>
        </div>

        <div class="mt-5 flex justify-end gap-3">
          <button
            class="px-6 py-2 rounded-lg bg-gray-700 text-white text-sm hover:bg-gray-600 transition-colors duration-150"
            @click="closeMacroConfig"
          >
            取消
          </button>
          <button
            class="px-6 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-500 transition-colors duration-150 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed"
            :disabled="macroConfigSetting"
            @click="saveMacroConfig"
          >
            {{ macroConfigSetting ? "保存中…" : "保存" }}
          </button>
        </div>
      </div>
    </div>

    <!-- 修改宏按键弹窗（设置宏内，点击键帽弹出） -->
    <div
      v-if="macroKeyEditing !== null"
      class="fixed inset-0 z-[60] flex items-center justify-center bg-black/60"
      @click.self="closeMacroKeyEdit"
    >
      <div class="w-[680px] rounded-2xl bg-gray-900 border border-gray-700 p-6">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-white-500">修改宏按键</h3>
          <button
            class="w-7 h-7 rounded-full bg-gray-800 text-gray-400 hover:text-white transition-colors duration-150"
            @click="closeMacroKeyEdit"
          >
            ✕
          </button>
        </div>

        <div class="mt-5 rounded-xl border border-gray-700 p-6">
          <div class="grid grid-cols-6 gap-3 w-fit mx-auto">
            <button
              v-for="k in FUNCTION_KEYS"
              :key="k.value"
              class="px-4 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150"
              :class="
                macroKeySelect === k.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-100 hover:bg-gray-700'
              "
              @click="macroKeySelect = k.value"
            >
              {{ k.short }}
            </button>
          </div>
        </div>

        <div class="mt-5 flex justify-end gap-3">
          <button
            class="px-6 py-2 rounded-lg bg-gray-700 text-white text-sm hover:bg-gray-600 transition-colors duration-150"
            @click="closeMacroKeyEdit"
          >
            取消
          </button>
          <button
            class="px-6 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-500 transition-colors duration-150 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed"
            :disabled="macroKeySelect === null"
            @click="confirmMacroKeyEdit"
          >
            确认
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from "vue";
import { useDeviceCommand } from "../composables/useDeviceCommand";
import { useHidDevice } from "../composables/useHidDevice";

// 宏按键
const macros = ["M1", "M2"];

// 当前展开下拉菜单的宏按键（null 为全部收起）
const macroMenu = ref(null);

function toggleMacroMenu(macro) {
  macroMenu.value = macroMenu.value === macro ? null : macro;
}

// 宏按键 → 映射
function onMacroMap(macro) {
  macroMenu.value = null;
  openMacroEdit(macro);
}

// 宏按键 → 宏设置
function onMacroSettings(macro) {
  macroMenu.value = null;
  openMacroConfig(macro);
}

// 物理按键值表：键值 0x01-0x10 → 实际按键
const mappings = ref([
  { code: 0x01, source: "Up", target: "--", keys: [], turboMode: 0, turboSpeed: 1 },
  { code: 0x02, source: "Right", target: "--", keys: [], turboMode: 0, turboSpeed: 1 },
  { code: 0x03, source: "Down", target: "--", keys: [], turboMode: 0, turboSpeed: 1 },
  { code: 0x04, source: "Left", target: "--", keys: [], turboMode: 0, turboSpeed: 1 },
  { code: 0x05, source: "A", target: "--", keys: [], turboMode: 0, turboSpeed: 1 },
  { code: 0x06, source: "B", target: "--", keys: [], turboMode: 0, turboSpeed: 1 },
  { code: 0x07, source: "X", target: "--", keys: [], turboMode: 0, turboSpeed: 1 },
  { code: 0x08, source: "Y", target: "--", keys: [], turboMode: 0, turboSpeed: 1 },
  { code: 0x09, source: "L1", target: "--", keys: [], turboMode: 0, turboSpeed: 1 },
  { code: 0x0a, source: "R1", target: "--", keys: [], turboMode: 0, turboSpeed: 1 },
  { code: 0x0b, source: "BACK", target: "--", keys: [], turboMode: 0, turboSpeed: 1 },
  { code: 0x0c, source: "START", target: "--", keys: [], turboMode: 0, turboSpeed: 1 },
  { code: 0x0d, source: "L3", target: "--", keys: [], turboMode: 0, turboSpeed: 1 },
  { code: 0x0e, source: "R3", target: "--", keys: [], turboMode: 0, turboSpeed: 1 },
  { code: 0x0f, source: "LT", target: "--", keys: [], turboMode: 0, turboSpeed: 1 },
  { code: 0x10, source: "RT", target: "--", keys: [], turboMode: 0, turboSpeed: 1 },
]);

// 手柄功能码值表（按弹窗展示顺序）：键值 / 弹窗短标签 / 行内显示名
const FUNCTION_KEYS = [
  { value: 0x21, short: "空", name: "空" },
  { value: 0x01, short: "L_Left", name: "L_Left" },
  { value: 0x02, short: "L_Right", name: "L_Right" },
  { value: 0x03, short: "L_Up", name: "L_Up" },
  { value: 0x04, short: "L_Down", name: "L_Down" },
  { value: 0x05, short: "R_Left", name: "R_Left" },
  { value: 0x06, short: "R_Right", name: "R_Right" },
  { value: 0x07, short: "R_Up", name: "R_Up" },
  { value: 0x08, short: "R_Down", name: "R_Down" },
  { value: 0x09, short: "LT", name: "LT" },
  { value: 0x0a, short: "RT", name: "RT" },
  { value: 0x0b, short: "Up", name: "Up" },
  { value: 0x0c, short: "Right", name: "Right" },
  { value: 0x0d, short: "Down", name: "Down" },
  { value: 0x0e, short: "Left", name: "Left" },
  { value: 0x0f, short: "A", name: "A" },
  { value: 0x10, short: "B", name: "B" },
  { value: 0x11, short: "X", name: "X" },
  { value: 0x12, short: "Y", name: "Y" },
  { value: 0x13, short: "LB", name: "L1" },
  { value: 0x14, short: "RB", name: "R1" },
  { value: 0x15, short: "BACK", name: "BACK" },
  { value: 0x16, short: "START", name: "START" },
  { value: 0x17, short: "L3", name: "L3" },
  { value: 0x18, short: "R3", name: "R3" },
];

const functionKey = (value) => FUNCTION_KEYS.find((k) => k.value === value);
const functionKeyName = (value) => functionKey(value)?.name || "--";

// 源按键分两列，每列 8 个
const columns = computed(() => {
  const half = Math.ceil(mappings.value.length / 2);
  return [mappings.value.slice(0, half), mappings.value.slice(half)];
});

// ===== 协议常量 =====
// 接收数据标准头：30 55 aa；回复 ID = 0xD0 读取 / 0xD1 设置
const HEADER = [0x30, 0x55, 0xaa];
const REPLY_ID_GET = 0xd0;
const REPLY_ID_SET = 0xd1;
const CMD_BUTTON_MAPPING = 0x02;
const CMD_TURBO = 0x0e;
// 设备类型：0x01 手柄 / 0x02 键盘 / 0x03 鼠标（键盘不处理）
const DEVICE_TYPE_GAMEPAD = 0x01;
// 连发动作：0x00 手动连发 / 0x02 取消一个按键的连发 / 0x03 自动连发
const TURBO_ACTION_MANUAL = 0x00;
const TURBO_ACTION_CANCEL = 0x02;
const TURBO_ACTION_AUTO = 0x03;

// 连发功能选项：0 关闭 / 1 半自动（手动连发）/ 2 全自动（自动连发）
const turboOptions = [
  { label: "关闭", value: 0 },
  { label: "半自动", value: 1 },
  { label: "全自动", value: 2 },
];

// ===== M1/M2 映射协议常量 =====
const CMD_MACRO_DATA = 0x05;
const CMD_MACRO_LOOP = 0x12;
// 宏数据键类型：0x00 手柄
const MACRO_KEY_TYPE_GAMEPAD = 0x00;
// 宏数据标识：0x00 按键映射（非映射数据时弹窗用默认选中）
const MACRO_DATA_TYPE_MAPPING = 0x00;
// M 键触发键值：M1=0x00 / M2=0x01
const MACRO_TRIGGERS = { M1: 0x00, M2: 0x01 };

// 测试模式按键报告（0xD4）位掩码 → 功能码值
// Key1=data[5]: bit0=Up bit1=Right bit2=Down bit3=Left bit4=A bit5=B bit6=X bit7=Y
// Key2=data[6]: bit0=L1 bit1=R1 bit2=BACK bit3=START bit4=L3 bit5=R3
const RECORD_KEY_BITS = [
  { byte: 5, bit: 0, key: 0x0b }, // Up
  { byte: 5, bit: 1, key: 0x0c }, // Right
  { byte: 5, bit: 2, key: 0x0d }, // Down
  { byte: 5, bit: 3, key: 0x0e }, // Left
  { byte: 5, bit: 4, key: 0x0f }, // A
  { byte: 5, bit: 5, key: 0x10 }, // B
  { byte: 5, bit: 6, key: 0x11 }, // X
  { byte: 5, bit: 7, key: 0x12 }, // Y
  { byte: 6, bit: 0, key: 0x13 }, // L1
  { byte: 6, bit: 1, key: 0x14 }, // R1
  { byte: 6, bit: 2, key: 0x15 }, // BACK
  { byte: 6, bit: 3, key: 0x16 }, // START
  { byte: 6, bit: 4, key: 0x17 }, // L3
  { byte: 6, bit: 5, key: 0x18 }, // R3
];
// L2/R2 为模拟量（data[12]=LT / data[13]=RT），超过阈值视为按下
const RECORD_TRIGGER_THRESHOLD = 0x40;
const RECORD_ANALOG_KEYS = [
  { byte: 12, key: 0x09 }, // LT
  { byte: 13, key: 0x0a }, // RT
];
// 非映射数据时的默认选中：M1 → LT / M2 → RT
const MACRO_DEFAULT_KEY = [0x09, 0x0a];

// 连发方式：0x00 点击（单击）/ 0x01 按住
const macroTriggerOptions = [
  { label: "按住", value: 1 },
  { label: "点击", value: 0 },
];
// 连发模式：0x00 关闭（不循环）/ 0x01 开启（循环）
const macroLoopOptions = [
  { label: "开启", value: 1 },
  { label: "关闭", value: 0 },
];

// 读取超时（ms）：超时未回复则继续读取下一项
const READ_TIMEOUT = 300;
// 最多可同时映射 2 个功能按键
const MAX_SELECT = 2;

const FIRST_KEY = 0x01;
const LAST_KEY = 0x10;
const KEYS = Array.from({ length: LAST_KEY - FIRST_KEY + 1 }, (_, i) => FIRST_KEY + i);
// 宏数据最大序号
const MACRO_MAX_SEQ = 19;
// 读取链：先读 M1/M2 宏循环模式，再读 M1/M2 宏数据（序号 0，后续按回复续读），
// 然后读 0x01-0x10 的映射，最后读 0x01-0x10 的连发
const READ_STEPS = [
  ...macros.map((m) => ({ cmd: CMD_MACRO_LOOP, code: MACRO_TRIGGERS[m] })),
  ...macros.map((m) => ({ cmd: CMD_MACRO_DATA, code: MACRO_TRIGGERS[m], seq: 0 })),
  ...KEYS.map((code) => ({ cmd: CMD_BUTTON_MAPPING, code })),
  ...KEYS.map((code) => ({ cmd: CMD_TURBO, code })),
];

// 进页面读取的宏缓存：每个触发键的循环模式 { triggerMode, loop }
const macroLoopStore = {};
// 每个触发键的宏数据：{ steps: [{ key, duration, delay }], isMapping: 是否按键映射数据 }
const macroDataStore = {};

const { requestButtonMapping, setButtonMapping, requestTurbo, setTurbo, requestMacroData, setMacroMapping, setMacroStep, setMacroEndFlag, requestMacroLoop, setMacroLoop, enterTestMode, exitTestMode } =
  useDeviceCommand();
const { subscribeInputReport, connected } = useHidDevice();

let unsubscribe = null;
let readTimer = null;
let stepIndex = 0;
// 当前正在等待回复的读取项
let pendingStep = null;

// 把设备返回/已下发的映射写入对应的源按键行
function applyMapping(code, deviceType, second, first) {
  const row = mappings.value.find((m) => m.code === code);
  if (!row) return;
  // 键盘数据不处理
  if (deviceType !== DEVICE_TYPE_GAMEPAD) return;

  row.keys = second ? [first, second] : [first];
  row.target = second
    ? `${functionKeyName(first)} + ${functionKeyName(second)}`
    : functionKeyName(first);
}

// 把设备返回的连发状态写入对应的源按键行
// 读取回复 Data1：0x00 当前按键没有连发 / 0x01 手动连发 / 0x02 自动连发
function applyTurbo(code, mode, speed) {
  const row = mappings.value.find((m) => m.code === code);
  if (!row) return;

  if (mode === 0x00) row.turboMode = 0;
  else if (mode === 0x01) row.turboMode = 1;
  else row.turboMode = 2;

  row.turboSpeed = speed >= 1 && speed <= 30 ? speed : 1;
}

function clearReadTimer() {
  if (readTimer) {
    clearTimeout(readTimer);
    readTimer = null;
  }
}

function readStep(index) {
  if (index >= READ_STEPS.length) {
    pendingStep = null;
    return;
  }
  stepIndex = index;
  pendingStep = READ_STEPS[index];
  if (pendingStep.cmd === CMD_BUTTON_MAPPING) requestButtonMapping(pendingStep.code);
  else if (pendingStep.cmd === CMD_TURBO) requestTurbo(pendingStep.code);
  else if (pendingStep.cmd === CMD_MACRO_LOOP) requestMacroLoop(pendingStep.code);
  else requestMacroData(pendingStep.code, pendingStep.seq);

  clearReadTimer();
  readTimer = setTimeout(() => readStep(index + 1), READ_TIMEOUT);
}

// 宏数据续读：当前步骤替换为同触发键的下一个序号（不动 stepIndex，超时/结束仍走下一项）
function readMacroDataStep(trigger, seq) {
  pendingStep = { cmd: CMD_MACRO_DATA, code: trigger, seq };
  requestMacroData(trigger, seq);

  clearReadTimer();
  readTimer = setTimeout(() => readStep(stepIndex + 1), READ_TIMEOUT);
}

function handleReport(data) {
  // 头(3) + ID + CMD + Device Mode + Data0-Data2
  if (data.length < 8) return;
  if (HEADER.some((b, i) => data[i] !== b)) return;

  // 测试模式按键报告（0xD4）：宏录制时解析按键序列
  if (macroRecording.value && data[3] === 0xd4) {
    handleRecordFrame(data, performance.now());
    return;
  }

  if (
    data[4] !== CMD_BUTTON_MAPPING &&
    data[4] !== CMD_TURBO &&
    data[4] !== CMD_MACRO_DATA &&
    data[4] !== CMD_MACRO_LOOP
  )
    return;
  if (data[3] !== REPLY_ID_GET && data[3] !== REPLY_ID_SET) return;

  // 宏数据回复：读取 0xD0 / 设置回执 0xD1 + 0x05
  if (data[4] === CMD_MACRO_DATA) {
    if (data.length < 16) return;
    // 设置回执：结构与下发指令一致（Device Mode + 设备类型 + 触发键 + 序号 + ...）
    if (data[3] === REPLY_ID_SET) {
      const trigger = data[7];
      const sequence = data[8];
      // 映射弹窗下发链：映射步骤 → 结束标志 → 循环指令
      if (
        macroLoopPending &&
        trigger === macroLoopPending.trigger &&
        sequence === MACRO_SET_EXPECT_SEQ[macroLoopPending.step]
      ) {
        finishMacroLoop();
        return;
      }
      // 设置宏保存链：按 phase 匹配期待序号后推进
      if (macroConfigPending && trigger === macroConfigPending.trigger) {
        const n = macroConfigPending.steps.length;
        const expect =
          macroConfigPending.phase === "truncate"
            ? n
            : macroConfigPending.phase === "step"
              ? macroConfigPending.index
              : macroConfigPending.phase === "end1"
                ? n
                : macroConfigPending.phase === "end2"
                  ? n + 1
                  : -1;
        if (sequence === expect) advanceMacroConfig();
      }
      return;
    }
    if (macroEditing.value === null && !(pendingStep && pendingStep.cmd === CMD_MACRO_DATA)) {
      return;
    }
    // 读取回复：Device Mode + 触发键 + 序号 + 功能键值 + 时长/延时 + 键类型 + 标志 + 数据标识
    const trigger = data[6];
    const seq = data[7];
    const functionValue = data[8];
    // 时长/延时大端，值即 ms
    const duration = (data[9] << 8) | data[10];
    const delay = (data[11] << 8) | data[12];
    const keyType = data[13];
    const dataId = data[15];

    // 进页面读取链：缓存宏数据；功能键值 0 表示上一条已是最后一条，否则续读下一序号。
    // 注意：设备读回的数据标识恒为 00（无论写入时是映射还是宏），不能用来区分数据类型。
    // 映射弹窗恰好打开时顺带回显（只有手柄类型的数据才回显选中）
    if (pendingStep && pendingStep.cmd === CMD_MACRO_DATA && pendingStep.code === trigger) {
      const store =
        macroDataStore[trigger] ?? (macroDataStore[trigger] = { steps: [] });
      if (functionValue !== 0 && functionKey(functionValue)) {
        store.steps.push({ key: functionValue, duration, delay });
      }
      if (
        macroEditing.value !== null &&
        trigger === MACRO_TRIGGERS[macros[macroEditing.value]] &&
        dataId === MACRO_DATA_TYPE_MAPPING &&
        keyType === MACRO_KEY_TYPE_GAMEPAD &&
        functionKey(functionValue)
      ) {
        macroKey.value = functionValue;
      }
      clearReadTimer();
      if (functionValue !== 0 && seq < MACRO_MAX_SEQ) {
        readMacroDataStep(trigger, seq + 1);
      } else {
        readStep(stepIndex + 1);
      }
      return;
    }

    // 非链上的宏数据回复（映射弹窗打开时补发的读取）：只回显
    if (macroEditing.value === null) return;
    if (trigger !== MACRO_TRIGGERS[macros[macroEditing.value]]) return;
    // 只有手柄类型的按键映射数据才回显选中，否则保持默认（M1→LT / M2→RT）
    if (
      dataId === MACRO_DATA_TYPE_MAPPING &&
      keyType === MACRO_KEY_TYPE_GAMEPAD &&
      functionKey(functionValue)
    ) {
      macroKey.value = functionValue;
    }
    return;
  }

  // 宏循环模式回复：ID 0xD0 + 0x12 + Device Mode + 触发键 + 触发方式(00单击/01按住) + 循环(00不循环/01循环)
  if (data[4] === CMD_MACRO_LOOP) {
    if (data.length < 9) return;
    if (data[3] !== REPLY_ID_GET) return;
    const trigger = data[6];
    // 进页面读取链：缓存循环模式后继续下一项
    if (pendingStep && pendingStep.cmd === CMD_MACRO_LOOP && pendingStep.code === trigger) {
      macroLoopStore[trigger] = {
        triggerMode: data[7] === 0x01 ? 1 : 0,
        loop: data[8] === 0x01 ? 1 : 0,
      };
      clearReadTimer();
      readStep(stepIndex + 1);
      return;
    }
    // M1/M2 映射弹窗打开时刷新弹窗内的连发方式 / 连发模式
    if (macroEditing.value !== null) {
      if (trigger !== MACRO_TRIGGERS[macros[macroEditing.value]]) return;
      macroTriggerMode.value = data[7] === 0x01 ? 1 : 0;
      macroLoop.value = data[8] === 0x01 ? 1 : 0;
      return;
    }
    // 设置宏弹窗打开时刷新触发方式 / 循环模式
    if (macroConfiguring.value !== null) {
      if (trigger !== MACRO_TRIGGERS[macros[macroConfiguring.value]]) return;
      macroConfigTrigger.value = data[7] === 0x01 ? 1 : 0;
      macroConfigLoop.value = data[8] === 0x01 ? 1 : 0;
    }
    return;
  }

  const code = data[6]; // Data0：物理按键键值

  if (data[4] === CMD_BUTTON_MAPPING) {
    // Data1：设备类型；Data2：第二个按键（0x00 表示只映射一个）；Data3：第一个按键
    applyMapping(code, data[7], data[8], data[9]);
  } else {
    // Data1：连发功能；Data2：连发速度 1-30
    applyTurbo(code, data[7], data[8]);
  }

  // 设置回复不参与读取链；只有当前等待中的回复才继续读下一项，避免超时后的迟到回复打乱顺序
  if (
    data[3] === REPLY_ID_GET &&
    pendingStep &&
    pendingStep.cmd === data[4] &&
    pendingStep.code === code
  ) {
    clearReadTimer();
    readStep(stepIndex + 1);
  }
}

// ===== 映射功能按键 / 连发 弹窗 =====
// 正在编辑的源按键行
const editing = ref(null);
// 已选中的功能键值，按点击先后顺序排列，最多 MAX_SELECT 个
const selection = ref([]);
// 连发状态直接绑定到正在编辑的行，读取回复到达后弹窗同步刷新
const turboMode = computed({
  get: () => editing.value?.turboMode ?? 0,
  set: (v) => {
    if (editing.value) editing.value.turboMode = v;
  },
});
const turboSpeed = computed({
  get: () => editing.value?.turboSpeed ?? 1,
  set: (v) => {
    if (editing.value) editing.value.turboSpeed = v;
  },
});

const selectedLabel = computed(() =>
  selection.value.map((v) => functionKey(v)?.short || "--").join(" + ")
);

function openEdit(row) {
  editing.value = row;
  selection.value = [...row.keys];
  // 重新读取一次该按键的连发状态
  requestTurbo(row.code);
}

function closeEdit() {
  editing.value = null;
  selection.value = [];
}

function toggleKey(value) {
  const idx = selection.value.indexOf(value);
  if (idx >= 0) {
    selection.value.splice(idx, 1);
    return;
  }
  // 已选满时，挤掉最早选中的那一个
  if (selection.value.length >= MAX_SELECT) selection.value.shift();
  selection.value.push(value);
}

function clampTurboSpeed(v) {
  let n = Number(v);
  if (!Number.isFinite(n)) n = 1;
  return Math.min(30, Math.max(1, Math.round(n)));
}

function commitTurboSpeed() {
  turboSpeed.value = clampTurboSpeed(turboSpeed.value);
}

function stepTurboSpeed(delta) {
  turboSpeed.value = clampTurboSpeed(turboSpeed.value + delta);
}

// 确认后按协议下发映射与连发
function confirmEdit() {
  const row = editing.value;
  if (!row || !selection.value.length) return;

  // 映射：第一个按键为首次选中的，第二个按键为之后选中的（只有一个时为 0x00）
  const first = selection.value[0];
  const second = selection.value[1] || 0x00;
  setButtonMapping(row.code, DEVICE_TYPE_GAMEPAD, second, first);
  applyMapping(row.code, DEVICE_TYPE_GAMEPAD, second, first);

  // 连发：关闭 → 取消该按键连发，半自动 → 手动连发，全自动 → 自动连发
  const action =
    turboMode.value === 0
      ? TURBO_ACTION_CANCEL
      : turboMode.value === 1
        ? TURBO_ACTION_MANUAL
        : TURBO_ACTION_AUTO;
  const speed = clampTurboSpeed(row.turboSpeed);
  row.turboSpeed = speed;
  setTurbo(action, speed, row.code);

  closeEdit();
}

// ===== M1/M2 映射弹窗 =====
// 正在编辑的宏按键索引：0=M1 / 1=M2 / null 关闭
const macroEditing = ref(null);
// 单选的功能键值（每次只能选择一个）
const macroKey = ref(null);
// 连发方式：0x00 点击（单击）/ 0x01 按住
const macroTriggerMode = ref(1);
// 连发模式：0x00 关闭（不循环）/ 0x01 开启（循环）
const macroLoop = ref(1);

function openMacroEdit(macro) {
  const index = macros.indexOf(macro);
  macroEditing.value = index;
  // 默认选中：M1 → LT / M2 → RT；连发默认 按住 + 开启
  macroKey.value = MACRO_DEFAULT_KEY[index] ?? null;
  macroTriggerMode.value = 1;
  macroLoop.value = 1;
  // 按协议读取该 M 键的映射数据与循环模式
  const trigger = MACRO_TRIGGERS[macro];
  requestMacroData(trigger);
  requestMacroLoop(trigger);
}

function closeMacroEdit() {
  macroEditing.value = null;
  macroKey.value = null;
  macroSetting.value = false;
  macroLoopPending = null;
}

// 宏设置下发中：等设备回执（0xD1/0x05）驱动下发链：
// 写映射步骤(序号0) → 结束标志(序号1) → 循环指令
// 各步骤期待的回执序号（按 step 索引）
const MACRO_SET_EXPECT_SEQ = [0, 1];
const macroSetting = ref(false);
let macroLoopPending = null; // { trigger, triggerMode, loop, step }

// 确认：按下发链逐步写入，每步收到回执后再发下一条
function confirmMacroEdit() {
  if (macroEditing.value === null || macroKey.value === null || macroSetting.value) return;
  const trigger = MACRO_TRIGGERS[macros[macroEditing.value]];
  macroLoopPending = {
    trigger,
    triggerMode: macroTriggerMode.value,
    loop: macroLoop.value,
    step: 0,
  };
  macroSetting.value = true;
  // 第 1 步：写映射步骤（序号 0，宏格式：时长 200ms / 延时 400ms / 标识 02）
  setMacroMapping(trigger, macroKey.value);
}

// 宏设置回执到达：按下发链推进，全部完成后关闭弹窗
function finishMacroLoop() {
  if (!macroLoopPending) return;
  const { trigger, triggerMode, loop, step } = macroLoopPending;
  if (step === 0) {
    // 第 2 步：写完实际步骤后标记列表结束（序号 1，功能键 00）
    macroLoopPending.step = 1;
    setMacroEndFlag(trigger, 1);
    return;
  }
  // 第 3 步：循环指令（触发方式 + 循环开关），完成
  macroLoopPending = null;
  macroSetting.value = false;
  setMacroLoop(trigger, triggerMode, loop);
  closeMacroEdit();
}

// ===== M1/M2 设置宏弹窗 =====
// 正在设置宏的按键索引：0=M1 / 1=M2 / null 关闭
const macroConfiguring = ref(null);
// 触发方式：0x00 点击（单击）/ 0x01 按住
const macroConfigTrigger = ref(0);
// 循环模式：0x00 关闭（不循环）/ 0x01 开启（循环）
const macroConfigLoop = ref(0);
// 录制中
const macroRecording = ref(false);
// 录制状态（帧驱动，非响应式）
// pressed=当前按住的键集合；pressInfo=每个按住键 {pressTime, step}（并行按键独立计时）；
// lastPress=最近一次按下事件 {pressTime, step}，下一键按下时回填它的间隔
// step 为宏列表行的响应式代理，改属性即实时刷新
let recordState = null;

// 开始录制：清空现有宏列表，发送进入测试模式指令，开始监听按键
function startMacroRecording() {
  if (macroRecording.value) return;
  macroRecording.value = true;
  macroConfigSteps.value = [];
  recordState = { pressed: new Set(), pressInfo: new Map(), lastPress: null };
  enterTestMode();
}

// 结束录制：发送退出测试模式指令；仍按住的键持续计到当前时刻，间隔保持 0
function stopMacroRecording() {
  if (!macroRecording.value) return;
  macroRecording.value = false;
  exitTestMode();
  if (recordState) {
    const now = performance.now();
    for (const info of recordState.pressInfo.values()) {
      info.step.duration = Math.round(now - info.pressTime);
    }
    recordState = null;
  }
}

// 录制步骤入列（满 20 条返回 null 不再增加）
// 返回数组中的响应式代理对象，后续改属性才能触发视图刷新
function pushRecordStep(key, duration, delay) {
  if (macroConfigSteps.value.length >= MACRO_MAX_STEPS) return null;
  macroConfigSteps.value.push({ key, duration, delay });
  return macroConfigSteps.value[macroConfigSteps.value.length - 1];
}

// 处理一帧测试模式按键报告（0xD4）：
// 按下 → 马上添加一行；释放 → 更新该行持续时间；下一键按下 → 更新上一行间隔
// 持续时间 = 按下到释放；间隔时间 = 当前键按下到下一键按下
function handleRecordFrame(data, now) {
  if (!recordState) return;

  // 解析当前按下的键集合
  const pressed = new Set();
  for (const b of RECORD_KEY_BITS) {
    if (data[b.byte] & (1 << b.bit)) pressed.add(b.key);
  }
  for (const a of RECORD_ANALOG_KEYS) {
    if (data[a.byte] >= RECORD_TRIGGER_THRESHOLD) pressed.add(a.key);
  }

  const prev = recordState.pressed;
  const released = [...prev].filter((k) => !pressed.has(k));
  const newPressed = [...RECORD_KEY_BITS, ...RECORD_ANALOG_KEYS]
    .map((b) => b.key)
    .filter((k) => pressed.has(k) && !prev.has(k));

  // 释放：持续时间 = 该键按下 → 释放（按住多久算多久，并行按键不截断）
  for (const k of released) {
    const info = recordState.pressInfo.get(k);
    if (info) {
      info.step.duration = Math.round(now - info.pressTime);
      recordState.pressInfo.delete(k);
    }
  }

  // 新按下：回填上一键的间隔（间隔 = 上键按下 → 本键按下），马上添加新行
  for (const k of newPressed) {
    if (recordState.lastPress) {
      const lp = recordState.lastPress;
      lp.step.delay = Math.round(now - lp.pressTime);
    }
    const step = pushRecordStep(k, 0, 0);
    if (!step) break; // 满 20 条
    recordState.pressInfo.set(k, { pressTime: now, step });
    recordState.lastPress = { pressTime: now, step };
  }

  recordState.pressed = pressed;
}
// 宏数据列表：{ key 功能键值, duration 时长 ms, delay 间隔 ms }（保存/读取协议待补充）
const macroConfigSteps = ref([]);
// 正在编辑的时间：{ index, field: duration|delay } / null
const macroTimeEditing = ref(null);
// 默认宏数据：A 键 / 时长 20ms / 间隔 20ms
const MACRO_DEFAULT_STEP = { key: 0x0f, duration: 20, delay: 20 };
// 数据最多 20 条（序号 0-19），序号 20 的槽位固定留给结束标志
const MACRO_MAX_STEPS = 20;
// 数据条数
const macroConfigCount = computed(() => macroConfigSteps.value.length);

// 时间编辑输入框自动聚焦
const vFocus = { mounted: (el) => el.focus() };

// 添加一组默认宏数据（at 为插入位置，默认末尾）
function addMacroStep(at = macroConfigSteps.value.length) {
  if (macroConfigSteps.value.length >= MACRO_MAX_STEPS) return;
  macroConfigSteps.value.splice(at, 0, { ...MACRO_DEFAULT_STEP });
}

function removeMacroStep(index) {
  macroConfigSteps.value.splice(index, 1);
  if (macroTimeEditing.value?.index === index) macroTimeEditing.value = null;
}

function clearMacroSteps() {
  macroConfigSteps.value = [];
  macroTimeEditing.value = null;
}

function isEditingTime(index, field) {
  return macroTimeEditing.value?.index === index && macroTimeEditing.value?.field === field;
}

// 时间编辑双向绑定（编辑中的行/字段）
const macroTimeValue = computed({
  get: () => {
    const e = macroTimeEditing.value;
    if (!e) return 0;
    return macroConfigSteps.value[e.index]?.[e.field] ?? 0;
  },
  set: (v) => {
    const e = macroTimeEditing.value;
    if (!e) return;
    const row = macroConfigSteps.value[e.index];
    if (row) row[e.field] = Number(v) || 0;
  },
});

// 提交时间：整数 ms，范围 0-60000ms（0 表示无时长/无延时）
function commitMacroTime() {
  const e = macroTimeEditing.value;
  if (!e) return;
  const row = macroConfigSteps.value[e.index];
  if (row) {
    let n = Math.round(Number(row[e.field]) || 0);
    if (n < 0) n = 0;
    if (n > 60000) n = 60000;
    row[e.field] = n;
  }
  macroTimeEditing.value = null;
}

function openMacroConfig(macro) {
  macroConfiguring.value = macros.indexOf(macro);
  const trigger = MACRO_TRIGGERS[macro];
  // 循环模式：进页面时已按协议读取（宏循环模式指令），直接使用缓存，无缓存时默认 点击 + 关闭
  const loopData = macroLoopStore[trigger];
  macroConfigTrigger.value = loopData?.triggerMode ?? 0;
  macroConfigLoop.value = loopData?.loop ?? 0;
  // 宏数据：进页面时已按协议读取缓存，直接载入列表（设备读回的标识恒 00，无法区分映射/宏）
  const dataStore = macroDataStore[trigger];
  macroConfigSteps.value = dataStore
    ? dataStore.steps.map((s) => ({ ...s }))
    : [];
  macroTimeEditing.value = null;
  macroRecording.value = false;
}

function closeMacroConfig() {
  // 保存中：中止下发流程，弹窗保持打开（可再次保存或取消）
  if (macroConfigSetting.value) {
    macroConfigPending = null;
    macroConfigSetting.value = false;
    return;
  }
  // 录制中关闭弹窗：退出测试模式
  if (macroRecording.value) stopMacroRecording();
  macroConfiguring.value = null;
  macroTimeEditing.value = null;
  macroKeyEditing.value = null;
}

// ===== 设置宏保存下发链 =====
// 保存中（按钮禁用显示"保存中…"）
const macroConfigSetting = ref(false);
let macroConfigPending = null;
// { trigger, triggerMode, loop, steps, phase, index }
// phase: truncate(预截断) → step(写步骤 0..n-1) → end1(结束标志 序号n) → end2(结束标志 序号n+1) → loop(循环指令)
// 每步等设备回执（0xD1/0x05，匹配触发键+序号）后发下一条

// 点击保存：预截断 → 每步数据 → 结束标志×2 → 循环指令
function saveMacroConfig() {
  if (macroConfiguring.value === null || macroConfigSetting.value) return;
  const trigger = MACRO_TRIGGERS[macros[macroConfiguring.value]];
  const steps = macroConfigSteps.value.map((s) => ({
    key: s.key,
    duration: Math.min(0xffff, Math.max(0, Math.round(Number(s.duration) || 0))),
    delay: Math.min(0xffff, Math.max(0, Math.round(Number(s.delay) || 0))),
  }));
  const n = steps.length;
  macroConfigPending = {
    trigger,
    triggerMode: macroConfigTrigger.value,
    loop: macroConfigLoop.value,
    steps,
    phase: "truncate",
    index: 0,
  };
  macroConfigSetting.value = true;
  if (n > 0) {
    // 第 1 步：预截断——先把结束标志写到新长度位置，防止旧宏残留
    setMacroEndFlag(trigger, n, 0x02);
  } else {
    // 空列表：直接写结束标志到序号 0，清空宏
    macroConfigPending.phase = "end1";
    setMacroEndFlag(trigger, 0, 0x02);
  }
}

// 回执到达后推进下发链
function advanceMacroConfig() {
  const p = macroConfigPending;
  if (!p) return;
  const n = p.steps.length;
  const { trigger } = p;

  if (p.phase === "truncate") {
    // 写步骤 index
    p.phase = "step";
    const s = p.steps[p.index];
    setMacroStep(trigger, p.index, s.key, s.duration, s.delay);
    return;
  }
  if (p.phase === "step") {
    p.index++;
    if (p.index < n) {
      const s = p.steps[p.index];
      setMacroStep(trigger, p.index, s.key, s.duration, s.delay);
      return;
    }
    // 步骤写完：写结束标志到序号 n（n 最多 20，序号 20 的槽位固定留给结束标志）
    p.phase = "end1";
    setMacroEndFlag(trigger, n, 0x02);
    return;
  }
  if (p.phase === "end1") {
    // 空列表（清空）：只需一个结束标志，直接发循环指令
    // 非空：再补一个结束标志到序号 n+1（n=20 时序号 20 已被 end1 占用，跳过）
    if (n > 0 && n + 1 <= MACRO_MAX_STEPS) {
      p.phase = "end2";
      setMacroEndFlag(trigger, n + 1, 0x02);
    } else {
      sendMacroLoopAndFinish();
    }
    return;
  }
  if (p.phase === "end2") {
    sendMacroLoopAndFinish();
  }
}

// 最后发送循环指令（触发方式 + 循环开关）并完成
function sendMacroLoopAndFinish() {
  const p = macroConfigPending;
  if (!p) return;
  setMacroLoop(p.trigger, p.triggerMode, p.loop);
  // 同步本地缓存，下次打开弹窗直接显示
  macroLoopStore[p.trigger] = { triggerMode: p.triggerMode, loop: p.loop };
  macroDataStore[p.trigger] = { steps: p.steps.map((s) => ({ ...s })) };
  macroConfigPending = null;
  macroConfigSetting.value = false;
  closeMacroConfig();
}

// ===== 修改宏按键弹窗（设置宏内，点击键帽弹出） =====
// 正在改键的宏数据行索引 / null
const macroKeyEditing = ref(null);
// 弹窗中选中的功能键值（单选）
const macroKeySelect = ref(null);

function openMacroKeyEdit(index) {
  macroKeyEditing.value = index;
  macroKeySelect.value = macroConfigSteps.value[index]?.key ?? null;
}

function closeMacroKeyEdit() {
  macroKeyEditing.value = null;
  macroKeySelect.value = null;
}

// 确认：把该行宏数据的功能键替换为选中的键
function confirmMacroKeyEdit() {
  if (macroKeyEditing.value === null || macroKeySelect.value === null) return;
  const row = macroConfigSteps.value[macroKeyEditing.value];
  if (row) row.key = macroKeySelect.value;
  closeMacroKeyEdit();
}

onMounted(() => {
  unsubscribe = subscribeInputReport(handleReport);
  if (connected.value) readStep(0);
});

onUnmounted(() => {
  clearReadTimer();
  if (unsubscribe) unsubscribe();
});
</script>