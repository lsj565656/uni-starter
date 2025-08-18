import App from './App'
// #ifdef APP
import i18n from './lang/i18n'
import { createPinia } from 'pinia'
let pinia = createPinia()
// #endif

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

// #ifdef VUE3
import { createSSRApp } from 'vue'

export function createApp() {
  const app = createSSRApp(App)
  // #ifdef APP
  app.use(i18n)
  app.use(pinia)
  // #endif
  return { app }
}
// #endif
