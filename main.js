import App from './App'
import i18n from './lang/i18n'
import { createPinia } from 'pinia'
const pinia = createPinia()

if (process.env.NODE_ENV === 'development') {
  const rawWarn = console.warn
  console.warn = function (message, ...arguments_) {
    if (
      typeof message === 'string' &&
      (message.includes("Not supported 'formatter'") ||
        message.includes("Not supported 'preserveDirectiveContent'"))
    ) {
      return
    }
    rawWarn.call(console, message, ...arguments_)
  }
}

// #ifndef VUE3
import Vue from 'vue'
Vue.config.productionTip = false
App.mpType = 'app'
const app = new Vue({
  i18n,
  ...App
})
app.$mount()
// #endif

// #ifdef VUE3
import { createSSRApp } from 'vue'

export function createApp() {
  const app = createSSRApp(App)
  app.use(i18n)
  app.use(pinia)
  return { app }
}
// #endif
