import { ref } from "vue";

const hidDevice = ref(null);
const connected = ref(false);
const inputSubscribers = [];
const attachSubscribers = [];
const logList = ref([]);

// 设备描述符中定义的输出报告：{ id, byteLength }
const outputReports = [];

// 输出报告固定 64 字节（Qt hid_write: 1字节ID + 64字节数据）
const FIXED_REPORT_LENGTH = 64;
// 输出通道不带 Report ID（独立厂商 Collection，无 0x85 项）
const OUTPUT_REPORT_ID = 0;

// 记录上次连接设备的 VID/PID，用于拔插后自动重连
let lastVid = null;
let lastPid = null;

function addLog(type, buffer) {
  const time = new Date().toLocaleTimeString();
  const hexStr = uint8ToHex(buffer);
  logList.value.push({ time, type, hex: hexStr });
}

function handleInputReport(event) {
  const data = new Uint8Array(event.data.buffer);
  addLog("rx", data);
  inputSubscribers.forEach((cb) => {
    try {
      cb(data);
    } catch (e) {
      console.error(e);
    }
  });
}

// 打开并绑定一个设备（首次连接 / 拔插重连共用）
async function attachDevice(device) {
  if (!device || connected.value) return false;
  if (!device.opened) {
    await device.open();
  }
  hidDevice.value = device;
  lastVid = device.vendorId;
  lastPid = device.productId;
  parseOutputReports(device);
  device.addEventListener("inputreport", handleInputReport);
  connected.value = true;
  addLog("sys", new TextEncoder().encode("设备已打开"));
  // 通知所有连接成功订阅者（首次连接与拔插重连都会触发）
  attachSubscribers.forEach((cb) => {
    try {
      cb();
    } catch (e) {
      console.error(e);
    }
  });
  return true;
}

navigator.hid.addEventListener("disconnect", ({ device }) => {
  if (hidDevice.value === device) {
    hidDevice.value = null;
    connected.value = false;
    outputReports.length = 0;
    alert("手柄已断开");
  }
});

// 设备重新插入：若是上次连接的手柄，自动重新打开（无需再次弹窗授权）
navigator.hid.addEventListener("connect", async ({ device }) => {
  if (
    !connected.value &&
    lastVid !== null &&
    device.vendorId === lastVid &&
    device.productId === lastPid
  ) {
    try {
      const granted = await navigator.hid.getDevices();
      const matched = granted.filter(
        (d) => d.vendorId === lastVid && d.productId === lastPid
      );
      if (matched.length) {
        const ok = await attachDevice(pickTargetInterface(matched));
        if (ok) console.log("[WebHID] 设备已自动重连");
      }
    } catch (err) {
      console.error("[WebHID] 自动重连失败:", err);
    }
  }
});

function hexToUint8Array(str) {
  const arr = str
    .trim()
    .split(/\s+/)
    .filter((s) => s);
  return new Uint8Array(arr.map((s) => parseInt(s, 16)));
}

function uint8ToHex(buf) {
  return Array.from(buf)
    .map((v) => v.toString(16).padStart(2, "0"))
    .join(" ");
}

// 从设备 collections 中解析输出报告 ID 和字节长度
function parseOutputReports(device) {
  outputReports.length = 0;
  (device.collections || []).forEach((col) => {
    (col.outputReports || []).forEach((report) => {
      let bits = 0;
      (report.items || []).forEach((item) => {
        bits += (item.reportSize || 0) * (item.reportCount || 0);
      });
      outputReports.push({
        id: report.reportId || 0,
        byteLength: Math.ceil(bits / 8),
      });
    });
  });
  console.log("[WebHID] 输出报告列表:", outputReports);
}

// 目标接口：厂商自定义用途 0xFF7A/0x01（即 USB interfaceNumber=2）。
// WebHID 不提供 interfaceNumber，同一 VID/PID 下的多个 HID 接口只能按顶层集合用途定位。
const TARGET_USAGE_PAGE = 0xff7a;
const TARGET_USAGE = 0x01;

function pickTargetInterface(devices) {
  return (
    devices.find((d) =>
      (d.collections || []).some(
        (c) => c.usagePage === TARGET_USAGE_PAGE && c.usage === TARGET_USAGE
      )
    ) || devices[0]
  );
}

// 目标手柄固定 VID/PID
const DEVICE_VID = 0x413d;
const DEVICE_PID = 0x2104;

export function useHidDevice() {
  const reportId = ref(0);
  const sendHexText = ref("10 55 aa 50 01 00");

  async function openDevice() {
    try {
      const devices = await navigator.hid.requestDevice({
        filters: [{ vendorId: DEVICE_VID, productId: DEVICE_PID }],
      });

      if (!devices || devices.length === 0) return;
      await attachDevice(pickTargetInterface(devices));
    } catch (err) {
      console.error(err);
      alert("打开失败：" + err.message);
    }
  }

  async function closeDevice() {
    if (!hidDevice.value) return;
    const device = hidDevice.value;
    try {
      device.removeEventListener("inputreport", handleInputReport);
      await device.close();
    } catch (e) {}
    hidDevice.value = null;
    connected.value = false;
    outputReports.length = 0;
    addLog("sys", new TextEncoder().encode("设备已断开"));
  }

  async function sendReport() {
    if (!hidDevice.value || !connected.value) return;
    try {
      const buf = hexToUint8Array(sendHexText.value);
      await hidDevice.value.sendReport(reportId.value, buf);
      addLog("tx", buf);
    } catch (err) {
      alert("发送失败：" + err.message);
    }
  }

  // 发送指令：Report ID=0（无 ID），指令体（10 55 aa 52 01/02...）补零到 64 字节
  async function sendCommand(hexStr, id = OUTPUT_REPORT_ID) {
    if (!hidDevice.value || !connected.value) return false;
    try {
      let buf = hexToUint8Array(hexStr);

      // 按描述符定义的报告字节长度自动补 0；未解析到时用固定 64 字节
      const info = outputReports.find((r) => r.id === id);
      const targetLen = info ? info.byteLength : FIXED_REPORT_LENGTH;
      if (targetLen > buf.length) {
        const padded = new Uint8Array(targetLen);
        padded.set(buf);
        buf = padded;
      }

      await hidDevice.value.sendReport(id, buf);
      addLog("tx", buf);
      return true;
    } catch (err) {
      alert("发送失败：" + err.message);
      return false;
    }
  }

  function clearSend() {
    sendHexText.value = "";
  }

  function clearLog() {
    logList.value = [];
  }

  async function copyLog() {
    const text = logList.value
      .map((l) => `[${l.time}] ${l.type} > ${l.hex}`)
      .join("\n");
    await navigator.clipboard.writeText(text);
    alert("日志已复制");
  }

  function subscribeInputReport(cb) {
    inputSubscribers.push(cb);
    return () => {
      const idx = inputSubscribers.indexOf(cb);
      if (idx >= 0) inputSubscribers.splice(idx, 1);
    };
  }

  function onAttach(cb) {
    attachSubscribers.push(cb);
    return () => {
      const idx = attachSubscribers.indexOf(cb);
      if (idx >= 0) attachSubscribers.splice(idx, 1);
    };
  }

  return {
    hidDevice,
    connected,
    reportId,
    sendHexText,
    logList,
    openDevice,
    closeDevice,
    sendReport,
    sendCommand,
    clearSend,
    clearLog,
    copyLog,
    addLog,
    subscribeInputReport,
    onAttach,
  };
}