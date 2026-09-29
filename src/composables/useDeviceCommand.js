import { useHidDevice } from "./useHidDevice";

// 测试模式指令：0x10 0x55 0xaa 0x52 0x01/0x02
// 0x01 = 进入测试模式，0x02 = 退出测试模式
const TEST_MODE_PREFIX = "10 55 aa 52";
const CMD_ENTER_TEST = "01";
const CMD_EXIT_TEST = "02";

// 摇杆校准指令：0x51 ID, 0x13 CMD, 00 Device Mode, 00 摇杆校准, 末字节 0x01 接入校准 / 0x00 结束校准
const STICK_CALIB_PREFIX = "10 55 aa 51 13 00 00";
// 扳机校准指令：0x51 ID, 0x13 CMD, 00 Device Mode, 01 扳机校准, 末字节 0x01 接入校准 / 0x00 结束校准
const TRIGGER_CALIB_PREFIX = "10 55 aa 51 13 00 01";
// 体感校准指令：0x51 ID, 0x13 CMD, 00 Device Mode, 02 体感校准, 末字节 0x01 接入校准 / 0x00 结束校准
const MOTION_CALIB_PREFIX = "10 55 aa 51 13 00 02";
const CMD_CALIB_ENTER = "01";
const CMD_CALIB_EXIT = "00";

// 获取摇杆灵敏度指令：0x50 ID, 0x86 CMD, 00 Device Mode, 末字节 0x00 左摇杆 / 0x01 右摇杆
const JOYSTICK_PREFIX = "10 55 aa 50 86 00";
const JOYSTICK_LEFT = "00";
const JOYSTICK_RIGHT = "01";

// 下发摇杆灵敏度指令：0x51 ID, 0x86 CMD, 00 Device Mode, 标志位, 8 个点（每点先 X 后 Y）
const JOYSTICK_SET_PREFIX = "10 55 aa 51 86 00";

// 获取设备信息（版本、电量）指令：0x50 ID, 0x01 CMD, 00 Device Mode
const DEVICE_INFO_PREFIX = "10 55 aa 50 01 00";

// 读取休眠时间指令：0x50 ID, 0x0F CMD, 00 Device Mode
const SLEEP_GET_PREFIX = "10 55 aa 50 0f 00";
// 设置休眠时间指令：0x51 ID, 0x0F CMD, 00 Device Mode, 末字节 01:15min / 02:60min / 03:不休眠
const SLEEP_SET_PREFIX = "10 55 aa 51 0f 00";

// 读取回报率指令：0x50 ID, 0x11 CMD, 00 Device Mode
const RATE_GET_PREFIX = "10 55 aa 50 11 00";
// 设置回报率指令：0x51 ID, 0x11 CMD, 00 Device Mode, USB / 2.4G / 蓝牙 三档
const RATE_SET_PREFIX = "10 55 aa 51 11 00";

// 读取摇杆步长指令：0x50 ID, 0x0D CMD, 00 Device Mode
const STEP_GET_PREFIX = "10 55 aa 50 0d 00";
// 设置摇杆步长指令：0x51 ID, 0x0D CMD, 00 Device Mode, 末字节 步长 0-255
const STEP_SET_PREFIX = "10 55 aa 51 0d 00";

// 读取轴设置指令：0x50 ID, 0x08 CMD, 00 Device Mode
const AXIS_GET_PREFIX = "10 55 aa 50 08 00";
// 设置轴设置指令：0x51 ID, 0x08 CMD, 00 Device Mode, 末字节 0:不互换 1:左摇杆和十字键互换 2:右摇杆和十字键互换 3:左右摇杆互换
const AXIS_SET_PREFIX = "10 55 aa 51 08 00";

// 恢复默认配置指令：0x51 ID, 0x04 CMD, 00 Device Mode
const RESET_FACTORY_PREFIX = "10 55 aa 51 04 00";

// 读取按键映射设置指令：0x50 ID, 0x02 CMD, Device Mode, 物理按键键值
const BUTTON_MAPPING_GET_PREFIX = "10 55 aa 50 02";
// 编辑按键映射指令：0x51 ID, 0x02 CMD, Device Mode, 物理按键键值, 设备类型, 第二个按键, 第一个按键
const BUTTON_MAPPING_SET_PREFIX = "10 55 aa 51 02";

// 读取按键连发指令：0x50 ID, 0x0e CMD, Device Mode, 物理按键键值
const TURBO_GET_PREFIX = "10 55 aa 50 0e";
// 设置按键连发指令：0x51 ID, 0x0e CMD, Device Mode, 动作, 连发速度(1-30), 物理按键键值
const TURBO_SET_PREFIX = "10 55 aa 51 0e";

// 读取摇杆死区指令：0x50 ID, 0x09 CMD, 00 Device Mode
const DEADZONE_GET_PREFIX = "10 55 aa 50 09 00";
// 设置摇杆死区指令：0x51 ID, 0x09 CMD, 00 Device Mode, 左中心 / 右中心 / 左外 / 右外（均 0-100）
const DEADZONE_SET_PREFIX = "10 55 aa 51 09 00";

// 读取马达震动指令：0x50 ID, 0x0C CMD, 00 Device Mode
// 回复 Data: 左手柄马达 0-100 / 右手柄马达 0-100 / 左扳机马达 / 右扳机马达 / 震动模式
const MOTOR_GET_PREFIX = "10 55 aa 50 0c 00";
// 设置马达震动指令：0x51 ID, 0x0C CMD, 00 Device Mode,
// 左手柄马达 / 右手柄马达 / 左扳机马达 / 右扳机马达 / 震动模式(00 原生扳机震动)
const MOTOR_SET_PREFIX = "10 55 aa 51 0c 00";

// 读取 LT/RT 死区指令：0x50 ID, 0x0A CMD, 00 Device Mode
// 回复 Data: LT 前死区 / RT 前死区 / RT 后死区 / LT 后死区（0-100）, LT 模式, RT 模式（0 长扳机 / 1 短扳机）
const TRIGGER_GET_PREFIX = "10 55 aa 50 0a 00";
// 设置 LT/RT 死区指令：0x51 ID, 0x0A CMD, 00 Device Mode,
// 扳机选择(0 LT / 1 RT), 前死区 0-100, 后死区 0-100, 模式(0 长扳机 / 1 短扳机)
const TRIGGER_SET_PREFIX = "10 55 aa 51 0a 00";

// 读取摇杆 XY 轴反转指令：0x50 ID, 0x07 CMD, 00 Device Mode
const INVERT_GET_PREFIX = "10 55 aa 50 07 00";
// 设置摇杆 XY 轴反转指令：0x51 ID, 0x07 CMD, 00 Device Mode, 标志位 0x00 左 / 0x01 右, X 反转, Y 反转
const INVERT_SET_PREFIX = "10 55 aa 51 07 00";

// 读取宏数据指令：0x50 ID, 0x05 CMD, 00 Device Mode, 触发键(M1=00/M2=01), 序号(0-19), 00 保留
const MACRO_DATA_GET_PREFIX = "10 55 aa 50 05 00";
// 编辑宏数据指令：0x51 ID, 0x05 CMD, 00 Device Mode, 设备类型(00手柄/01键盘/02鼠标), 触发键, 序号,
// 功能键值, 持续时间高/低字节, 触发延时高/低字节, 单键映射标志, 数据标识(00按键映射/01连发/02宏)
const MACRO_DATA_SET_PREFIX = "10 55 aa 51 05 00";
// 读取宏循环模式指令：0x50 ID, 0x12 CMD, 00 Device Mode, 触发键 0-7(M1,M2...)
const MACRO_LOOP_GET_PREFIX = "10 55 aa 50 12 00";
// 编辑宏循环模式指令：0x51 ID, 0x12 CMD, 00 Device Mode, 触发键, 触发方式(00单击/01按住), 循环(00不循环/01循环)
const MACRO_LOOP_SET_PREFIX = "10 55 aa 51 12 00";

const toHex = (v) => (v & 0xff).toString(16).padStart(2, "0");

export function useDeviceCommand() {
  const { sendCommand, connected } = useHidDevice();

  async function requestDeviceInfo() {
    if (!connected.value) return false;
    return sendCommand(DEVICE_INFO_PREFIX);
  }

  async function requestSleepTime() {
    if (!connected.value) return false;
    return sendCommand(SLEEP_GET_PREFIX);
  }

  async function setSleepTime(value) {
    if (!connected.value) return false;
    const hex = (value & 0xff).toString(16).padStart(2, "0");
    return sendCommand(`${SLEEP_SET_PREFIX} ${hex}`);
  }

  async function requestRefreshRate() {
    if (!connected.value) return false;
    return sendCommand(RATE_GET_PREFIX);
  }

  // 设置回报率：usb / wifi / ble 分别为三档编码
  async function setRefreshRate(usb, wifi, ble) {
    if (!connected.value) return false;
    const hex = [usb, wifi, ble]
      .map((v) => (v & 0xff).toString(16).padStart(2, "0"))
      .join(" ");
    return sendCommand(`${RATE_SET_PREFIX} ${hex}`);
  }

  async function requestStep() {
    if (!connected.value) return false;
    return sendCommand(STEP_GET_PREFIX);
  }

  async function setStep(value) {
    if (!connected.value) return false;
    const hex = (value & 0xff).toString(16).padStart(2, "0");
    return sendCommand(`${STEP_SET_PREFIX} ${hex}`);
  }

  async function requestAxis() {
    if (!connected.value) return false;
    return sendCommand(AXIS_GET_PREFIX);
  }

  async function setAxis(value) {
    if (!connected.value) return false;
    const hex = (value & 0xff).toString(16).padStart(2, "0");
    return sendCommand(`${AXIS_SET_PREFIX} ${hex}`);
  }

  async function resetFactory() {
    if (!connected.value) return false;
    return sendCommand(RESET_FACTORY_PREFIX);
  }

  async function enterTestMode() {
    if (!connected.value) return false;
    return sendCommand(`${TEST_MODE_PREFIX} ${CMD_ENTER_TEST}`);
  }

  async function exitTestMode() {
    if (!connected.value) return false;
    return sendCommand(`${TEST_MODE_PREFIX} ${CMD_EXIT_TEST}`);
  }

  async function startStickCalibration() {
    if (!connected.value) return false;
    return sendCommand(`${STICK_CALIB_PREFIX} ${CMD_CALIB_ENTER}`);
  }

  async function finishStickCalibration() {
    if (!connected.value) return false;
    return sendCommand(`${STICK_CALIB_PREFIX} ${CMD_CALIB_EXIT}`);
  }

  async function startTriggerCalibration() {
    if (!connected.value) return false;
    return sendCommand(`${TRIGGER_CALIB_PREFIX} ${CMD_CALIB_ENTER}`);
  }

  async function finishTriggerCalibration() {
    if (!connected.value) return false;
    return sendCommand(`${TRIGGER_CALIB_PREFIX} ${CMD_CALIB_EXIT}`);
  }

  async function startMotionCalibration() {
    if (!connected.value) return false;
    return sendCommand(`${MOTION_CALIB_PREFIX} ${CMD_CALIB_ENTER}`);
  }

  async function finishMotionCalibration() {
    if (!connected.value) return false;
    return sendCommand(`${MOTION_CALIB_PREFIX} ${CMD_CALIB_EXIT}`);
  }

  // 获取摇杆灵敏度：isRight 为 true 取右摇杆，否则取左摇杆
  async function requestJoystickSensitivity(isRight = false) {
    if (!connected.value) return false;
    return sendCommand(`${JOYSTICK_PREFIX} ${isRight ? JOYSTICK_RIGHT : JOYSTICK_LEFT}`);
  }

  // 读取按键映射：physicalKey 为物理按键键值，deviceMode 为 4 套中的一套（0-3）
  async function requestButtonMapping(physicalKey, deviceMode = 0) {
    if (!connected.value) return false;
    const hex = [deviceMode, physicalKey]
      .map((v) => (v & 0xff).toString(16).padStart(2, "0"))
      .join(" ");
    return sendCommand(`${BUTTON_MAPPING_GET_PREFIX} ${hex}`);
  }

  // 编辑按键映射：physicalKey 物理按键键值，deviceType 0x01 手柄 / 0x02 键盘 / 0x03 鼠标，
  // secondKey 第二个按键（只映射一个按键时为 0x00），firstKey 第一个按键
  async function setButtonMapping(
    physicalKey,
    deviceType,
    secondKey,
    firstKey,
    deviceMode = 0
  ) {
    if (!connected.value) return false;
    const hex = [deviceMode, physicalKey, deviceType, secondKey, firstKey]
      .map((v) => (v & 0xff).toString(16).padStart(2, "0"))
      .join(" ");
    return sendCommand(`${BUTTON_MAPPING_SET_PREFIX} ${hex}`);
  }

  // 读取按键连发：physicalKey 为物理按键键值
  async function requestTurbo(physicalKey, deviceMode = 0) {
    if (!connected.value) return false;
    const hex = [deviceMode, physicalKey]
      .map((v) => (v & 0xff).toString(16).padStart(2, "0"))
      .join(" ");
    return sendCommand(`${TURBO_GET_PREFIX} ${hex}`);
  }

  // 设置按键连发：action 0x00 手动连发 / 0x01 清除所有按键连发 / 0x02 取消一个按键连发 / 0x03 自动连发，
  // speed 连发速度 1-30，physicalKey 物理按键键值
  async function setTurbo(action, speed, physicalKey, deviceMode = 0) {
    if (!connected.value) return false;
    const hex = [deviceMode, action, speed, physicalKey]
      .map((v) => (v & 0xff).toString(16).padStart(2, "0"))
      .join(" ");
    return sendCommand(`${TURBO_SET_PREFIX} ${hex}`);
  }

  // 读取摇杆死区
  async function requestDeadzone() {
    if (!connected.value) return false;
    return sendCommand(DEADZONE_GET_PREFIX);
  }

  // 设置摇杆死区：左/右摇杆的中心死区与外死区，均为 0-100
  async function setDeadzone(ltCenter, rtCenter, ltOuter, rtOuter) {
    if (!connected.value) return false;
    const hex = [ltCenter, rtCenter, ltOuter, rtOuter]
      .map((v) => (v & 0xff).toString(16).padStart(2, "0"))
      .join(" ");
    return sendCommand(`${DEADZONE_SET_PREFIX} ${hex}`);
  }

  // 读取摇杆 XY 轴反转
  async function requestInvert() {
    if (!connected.value) return false;
    return sendCommand(INVERT_GET_PREFIX);
  }

  // 读取马达震动：回复左手柄/右手柄/左扳机/右扳机马达 0-100 + 震动模式
  async function requestMotorVibration() {
    if (!connected.value) return false;
    return sendCommand(MOTOR_GET_PREFIX);
  }

  // 设置马达震动：左/右扳机马达跟随手柄马达值，震动模式固定 0x00 原生扳机震动
  async function setMotorVibration(leftMotor, rightMotor) {
    if (!connected.value) return false;
    const hex = [leftMotor, rightMotor, leftMotor, rightMotor, 0x00]
      .map((v) => (v & 0xff).toString(16).padStart(2, "0"))
      .join(" ");
    return sendCommand(`${MOTOR_SET_PREFIX} ${hex}`);
  }

  // 读取 LT/RT 死区：回复 LT/RT 前后死区 0-100 + 长短扳机模式
  async function requestTriggerDeadzone() {
    if (!connected.value) return false;
    return sendCommand(TRIGGER_GET_PREFIX);
  }

  // 设置 LT/RT 死区：isRight 选扳机（false LT / true RT），front/rear 为前后死区 0-100，short 为 true 短扳机 / false 长扳机
  async function setTriggerDeadzone(isRight, front, rear, short) {
    if (!connected.value) return false;
    const hex = [isRight ? 1 : 0, front, rear, short ? 1 : 0]
      .map((v) => (v & 0xff).toString(16).padStart(2, "0"))
      .join(" ");
    return sendCommand(`${TRIGGER_SET_PREFIX} ${hex}`);
  }

  // 设置摇杆 XY 轴反转：isRight 选摇杆，invertX / invertY 为 0 不反转、1 反转
  async function setInvert(isRight, invertX, invertY) {
    if (!connected.value) return false;
    const hex = [isRight ? 1 : 0, invertX, invertY]
      .map((v) => (v & 0xff).toString(16).padStart(2, "0"))
      .join(" ");
    return sendCommand(`${INVERT_SET_PREFIX} ${hex}`);
  }

  // 读取宏数据：triggerKey 0x00=M1 / 0x01=M2，sequence 0-19
  async function requestMacroData(triggerKey, sequence = 0) {
    if (!connected.value) return false;
    return sendCommand(
      `${MACRO_DATA_GET_PREFIX} ${toHex(triggerKey)} ${toHex(sequence)} 00`
    );
  }

  // 编辑宏数据（M 键映射）：时长 200ms、延时 400ms、单键标志 01、数据标识 00=按键映射
  async function setMacroMapping(triggerKey, functionKey) {
    if (!connected.value) return false;
    // 设备类型 00 手柄 / 序号 00 / 功能键值 / 持续时间 0014(200ms) / 触发延时 0028(400ms) / 单键标志 01 / 数据标识 00
    return sendCommand(
      `${MACRO_DATA_SET_PREFIX} 00 ${toHex(triggerKey)} 00 ${toHex(functionKey)} 00 14 00 28 01 00`
    );
  }

  // 编辑宏数据（宏设置）：时长/延时为 ms 值大端写入，单键标志 00（宏），数据标识 02=宏
  async function setMacroStep(triggerKey, sequence, functionKey, duration, delay) {
    if (!connected.value) return false;
    const word = (v) =>
      `${toHex((v >> 8) & 0xff)} ${toHex(v & 0xff)}`;
    // 设备类型 00 手柄 / 序号 / 功能键值 / 持续时间 / 触发延时 / 标志 00 / 数据标识 02
    return sendCommand(
      `${MACRO_DATA_SET_PREFIX} 00 ${toHex(triggerKey)} ${toHex(sequence)} ${toHex(functionKey)} ${word(duration)} ${word(delay)} 00 02`
    );
  }

  // 写入宏列表结束标志：功能键值 00 表示列表结束；dataId 00=按键映射（M 键映射）/ 02=宏（宏设置）
  async function setMacroEndFlag(triggerKey, sequence, dataId = 0x00) {
    if (!connected.value) return false;
    // 设备类型 00 手柄 / 序号 / 功能键值 00 结束 / 持续时间 0000 / 触发延时 0000 / 标志 00 / 数据标识
    return sendCommand(
      `${MACRO_DATA_SET_PREFIX} 00 ${toHex(triggerKey)} ${toHex(sequence)} 00 00 00 00 00 00 ${toHex(dataId)}`
    );
  }

  // 读取宏循环模式：triggerKey 0x00=M1 / 0x01=M2
  async function requestMacroLoop(triggerKey) {
    if (!connected.value) return false;
    return sendCommand(`${MACRO_LOOP_GET_PREFIX} ${toHex(triggerKey)}`);
  }

  // 编辑宏循环模式：triggerMode 0x00 单击(点击) / 0x01 按住；loop 0x00 不循环(关闭) / 0x01 循环(开启)
  async function setMacroLoop(triggerKey, triggerMode, loop) {
    if (!connected.value) return false;
    return sendCommand(
      `${MACRO_LOOP_SET_PREFIX} ${toHex(triggerKey)} ${toHex(triggerMode)} ${toHex(loop)}`
    );
  }

  // 下发摇杆灵敏度：points 为 8 个 { in, out }，取值范围 0-100
  async function sendJoystickSensitivity(isRight, points) {
    if (!connected.value) return false;
    const hex = points
      .map((p) =>
        [p.in, p.out].map((v) => (v & 0xff).toString(16).padStart(2, "0")).join(" ")
      )
      .join(" ");
    return sendCommand(
      `${JOYSTICK_SET_PREFIX} ${isRight ? JOYSTICK_RIGHT : JOYSTICK_LEFT} ${hex}`
    );
  }

  return {
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
    enterTestMode,
    exitTestMode,
    startStickCalibration,
    finishStickCalibration,
    startTriggerCalibration,
    finishTriggerCalibration,
    startMotionCalibration,
    finishMotionCalibration,
    requestJoystickSensitivity,
    sendJoystickSensitivity,
    requestButtonMapping,
    setButtonMapping,
    requestTurbo,
    setTurbo,
    requestDeadzone,
    setDeadzone,
    requestInvert,
    requestMotorVibration,
    setMotorVibration,
    requestTriggerDeadzone,
    setTriggerDeadzone,
    setInvert,
    requestMacroData,
    setMacroMapping,
    setMacroStep,
    setMacroEndFlag,
    requestMacroLoop,
    setMacroLoop,
  };
}
