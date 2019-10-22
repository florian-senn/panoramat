import Vue from 'vue'
import Vuex from 'vuex'
import ui from './ui'
import LogRocket from 'logrocket'
import createPlugin from 'logrocket-vuex'
Vue.use(Vuex)

const logrocketPlugin = createPlugin(LogRocket)

/*
 * If not building with SSR mode, you can
 * directly export the Store instantiation
 */

export default function (/* { ssrContext } */) {
  const Store = new Vuex.Store({
    modules: {
      ui
    },
    plugins: [logrocketPlugin],
    // enable strict mode (adds overhead!)
    // for dev mode only
    strict: process.env.DEV
  })

  return Store
}
