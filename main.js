import App from './App'
import i18n from './lang/i18n'


if (process.env.NODE_ENV === 'development') {
	const rawWarn = console.warn;
	console.warn = function(msg, ...args) {
	  if (
		typeof msg === 'string' &&
		(msg.includes('Not supported \'formatter\'') || msg.includes('Not supported \'preserveDirectiveContent\''))
	  ) {
		return;
	  }
	  rawWarn.call(console, msg, ...args);
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
import {createSSRApp} from 'vue'

export function createApp() {
	const app = createSSRApp(App)
	app.use(i18n)
	return {app}
}
// #endif
