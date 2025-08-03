<script setup>
import Papa from 'papaparse'
import { ref } from 'vue'
import ProgressSpinner from 'primevue/progressspinner'
import MultiSelect from 'primevue/multiselect'
import Button from 'primevue/button'
import Chart from 'primevue/chart'
import Slider from 'primevue/slider'

const rawData = ref([])
const isExtracting = ref(false)
const isChartLoading = ref(false)
const experimentList = ref([])
const selectedExperiments = ref([])
const metricList = ref([])
const selectedMetrics = ref([])
const chartData = ref(null)
const maxPoints = ref(300)
const fileInputRef = ref(null)
const uploadedFileName = ref('')

function triggerFileInput() {
  if (fileInputRef.value && !uploadedFileName.value) {
    fileInputRef.value.click()
  }
}

const onFileUpload = (event) => {
  const file = event.target.files[0]
  if (!file) return

  uploadedFileName.value = file.name
  isExtracting.value = true
  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      rawData.value = results.data
      extractData()
      isExtracting.value = false
    },
  })
}

const extractData = () => {
  const exps = [...new Set(rawData.value.map((row) => row.experiment_id))]
  const metrics = [...new Set(rawData.value.map((row) => row.metric_name))]
  experimentList.value = exps.map((id) => ({ label: id, value: id }))
  metricList.value = metrics.map((m) => ({ label: m, value: m }))
}

const updateChart = () => {
  isChartLoading.value = true
  setTimeout(() => {
    const data = buildChartData()
    if (data.datasets.length === 0) {
      alert('⚠️ No data for chart found. Check experiments or metrics.')
      isChartLoading.value = false
      return
    }
    chartData.value = data
    isChartLoading.value = false
  }, 600)
}

function downsample(data, maxPointsVal = 300) {
  if (data.length <= maxPointsVal) return data
  const step = Math.floor(data.length / maxPointsVal)
  return data.filter((_, index) => index % step === 0)
}

const buildChartData = () => {
  const datasets = []
  const metricsToUse = selectedMetrics.value.length
    ? selectedMetrics.value
    : [...new Set(rawData.value.map((row) => row.metric_name))]
  for (const metric of metricsToUse) {
    for (const expId of selectedExperiments.value) {
      const dataPoints = rawData.value
        .filter((r) => r.experiment_id === expId && r.metric_name === metric)
        .map((r) => ({ x: Number(r.step), y: Number(r.value) }))
      const sampledPoints = downsample(dataPoints, maxPoints.value)
      if (sampledPoints.length > 0) {
        datasets.push({
          label: `${expId} - ${metric}`,
          data: sampledPoints,
          fill: false,
          borderColor: randomColor(),
          tension: 0.1,
        })
      }
    }
  }
  return { datasets }
}

const chartOptions = {
  responsive: true,
  plugins: {
    legend: { position: 'bottom' },
  },
  scales: {
    x: {
      title: { display: true, text: 'Step' },
      type: 'linear',
    },
    y: {
      title: { display: true, text: 'Value' },
    },
  },
}

function randomColor() {
  const r = Math.floor(Math.random() * 255)
  const g = Math.floor(Math.random() * 255)
  const b = Math.floor(Math.random() * 255)
  return `rgb(${r},${g},${b})`
}

function resetApp() {
  rawData.value = []
  experimentList.value = []
  selectedExperiments.value = []
  metricList.value = []
  selectedMetrics.value = []
  chartData.value = null
  maxPoints.value = 300
  isExtracting.value = false
  isChartLoading.value = false
  uploadedFileName.value = ''
  if (fileInputRef.value) {
    fileInputRef.value.value = null
  }
}
</script>

<template>
  <div class="main-bg">
    <div class="container card">
      <div class="header-row">
        <h2 class="title">MLOps Experiment Viewer</h2>
        <Button
          icon="pi pi-refresh"
          class="p-button-rounded p-button-text reset-btn"
          @click="resetApp"
          aria-label="Reset"
        >
          <span class="arrow-icon">&#x21bb;</span>
        </Button>
      </div>
      <input
        ref="fileInputRef"
        type="file"
        @change="onFileUpload"
        accept=".csv"
        class="hidden-file-input"
      />
      <div class="file-upload-row">
        <Button
          icon="pi pi-upload"
          class="p-button w-full file-upload-btn"
          @click="triggerFileInput"
          :disabled="!!uploadedFileName"
          aria-label="Upload CSV"
        />
        <span v-if="uploadedFileName" class="file-name-label">{{ uploadedFileName }}</span>
      </div>

      <div v-if="isExtracting" class="centered">
        <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="4" />
        <div class="loading-label">Loading experiments...</div>
      </div>

      <div v-else>
        <div v-if="experimentList.length" class="mt-4">
          <MultiSelect
            v-model="selectedExperiments"
            :options="experimentList"
            optionLabel="label"
            optionValue="value"
            display="chip"
            filter
            placeholder="Select experiments"
            class="w-full"
          />
        </div>
        <div v-if="selectedExperiments.length && metricList.length" class="mt-4">
          <MultiSelect
            v-model="selectedMetrics"
            :options="metricList"
            optionLabel="label"
            optionValue="value"
            display="chip"
            filter
            placeholder="Choose metrics"
            class="w-full"
          />
        </div>

        <div v-if="selectedExperiments.length" class="mt-4">
          <label for="points-slider" class="slider-label">Number of points on the chart: {{ maxPoints }}</label>
          <Slider
            id="points-slider"
            v-model="maxPoints"
            :min="50"
            :max="1000"
            :step="10"
            class="w-full"
          />
        </div>

        <div v-if="selectedExperiments.length" class="mt-4">
          <Button label="Build a chart" @click="updateChart" class="p-button w-full" />
        </div>

        <div v-if="isChartLoading" class="centered mt-6">
          <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="4" />
          <div class="loading-label">Building chart...</div>
        </div>

        <div v-if="chartData && !isChartLoading" class="mt-6 chart-card">
          <Chart
            :key="selectedExperiments.join(',') + maxPoints"
            type="line"
            :data="buildChartData()"
            :options="chartOptions"
            class="Chart"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');

body,
.main-bg {
  font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
  background: linear-gradient(135deg, #f3f4f8 0%, #e9ecef 100%);
  min-height: 100vh;
  margin: 0;
  padding: 0;
}

.main-bg {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
}

.container.card {
  max-width: 650px;
  width: 100%;
  border-radius: 18px;
  box-shadow: 0 6px 32px rgba(60, 72, 88, 0.12);
  background: #fff;
  padding: 2rem 2.5rem;
}

.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.title {
  font-size: 2rem;
  font-weight: 700;
  color: #2d3748;
  letter-spacing: -1px;
  margin-bottom: 1.5rem;
}

.reset-btn {
  margin-left: 1rem;
  font-size: 1.5rem;
  color: #5a67d8;
  background: none;
  border: none;
  box-shadow: none;
}

.arrow-icon {
  font-size: 1.7rem;
  vertical-align: middle;
}
.hidden-file-input {
  display: none;
}

.w-full {
  width: 100%;
}

.mt-4 {
  margin-top: 1.5rem;
}

.mt-6 {
  margin-top: 2rem;
}

.chart-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(60, 72, 88, 0.07);
  padding: 1rem;
}

.centered {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.loading-label {
  margin-top: 0.75rem;
  color: #5a67d8;
  font-weight: 500;
  font-size: 1.1rem;
}

.slider-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #4c51bf;
}

.file-upload-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}
.file-name-label {
  font-size: 1rem;
  color: #4c51bf;
  font-weight: 500;
}
</style>