
import { createApp } from 'vue'
import App from './App.vue'
import PrimeVue from 'primevue/config'
import FileUpload from 'primevue/fileupload'

import 'primeicons/primeicons.css'
import MultiSelect from 'primevue/multiselect'
import Chart from 'primevue/chart'
import Button from 'primevue/button'
import Select from 'primevue/select'
import Checkbox from 'primevue/checkbox'
import Card from 'primevue/card'
import ProgressSpinner from 'primevue/progressspinner'
import Slider from 'primevue/slider'

import Noir from './presets/Noir.js'

const app = createApp(App)

app.use(PrimeVue, {
  theme: {
    preset: Noir,
    options: {
      prefix: 'p',
      darkModeSelector: '.p-dark',
      cssLayer: false,
    },
  },
})
app.use(PrimeVue)
app.component('FileUpload', FileUpload)
app.component('Select', Select)
app.component('Checkbox', Checkbox)
app.component('MultiSelect', MultiSelect)
app.component('Chart', Chart)
app.component('Button', Button)
app.component('Card', Card)
app.component('ProgressSpinner', ProgressSpinner)
app.component('Slider', Slider)

app.mount('#app')
