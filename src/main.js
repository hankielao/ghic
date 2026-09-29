import { createApp } from "vue";
import { createRouter, createWebHashHistory } from "vue-router";
import "./style.css";
import App from "./App.vue";

import Home from "./views/Home.vue";
import Joystick from "./views/Joystick.vue";
import Button from "./views/Button.vue";
import Motion from "./views/Motion.vue";
import Vibration from "./views/Vibration.vue";
import Trigger from "./views/Trigger.vue";
import Light from "./views/Light.vue";
import Calibrate from "./views/Calibrate.vue";
import Test from "./views/Test.vue";
import { useDeviceCommand } from "./composables/useDeviceCommand";
import { useHidDevice } from "./composables/useHidDevice";

const routes = [
  { path: "/", component: Home },
  { path: "/joystick", component: Joystick },
  { path: "/button", component: Button },
  { path: "/motion", component: Motion },
  { path: "/vibration", component: Vibration },
  { path: "/trigger", component: Trigger },
  { path: "/light", component: Light },
  { path: "/calibrate", component: Calibrate },
  { path: "/test", component: Test },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

const { enterTestMode, exitTestMode } = useDeviceCommand();

router.beforeEach((to, from) => {
  // 离开测试页：退出测试模式
  if (from.path === "/test" && to.path !== "/test") {
    exitTestMode();
  }
  // 进入测试页：进入测试模式
  if (to.path === "/test" && from.path !== "/test") {
    enterTestMode();
  }
});

// 每次连接成功（首次连接 / 拔插自动重连）都进入首页
const { onAttach } = useHidDevice();
onAttach(() => {
  if (router.currentRoute.value.path !== "/") {
    router.push("/");
  }
});

createApp(App).use(router).mount("#app");