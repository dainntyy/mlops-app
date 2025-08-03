import { reactive } from 'vue'

export default {
  install: (app) => {
    const _appState = reactive({ theme: 'Noir', darkTheme: true })

    app.config.globalProperties.$appState = _appState
  },
}
