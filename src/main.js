
import { createApp } from 'vue'
import App from './App.vue'
import PrimeVue from 'primevue/config'
import FileUpload from 'primevue/fileupload'

// import 'primevue/resources/themes/aura-dark-purple/theme.css'
// import 'primevue/resources/primevue.min.css'
import 'primeicons/primeicons.css'
import MultiSelect from 'primevue/multiselect'
import Chart from 'primevue/chart'
import Button from 'primevue/button'
import Select from 'primevue/select'
import Checkbox from 'primevue/checkbox'

const app = createApp(App)
app.use(PrimeVue)
app.component('FileUpload', FileUpload)
app.component('Select', Select)
app.component('Checkbox', Checkbox)
app.component('MultiSelect', MultiSelect)
app.component('Chart', Chart)
app.component('Button', Button)

app.mount('#app')
